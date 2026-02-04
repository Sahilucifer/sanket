import { vi } from 'vitest';
import { AuthService } from '../services/authService';
import { supabase } from '../config/database';

// Mock the logger to avoid console output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }
}));

describe('AuthService', () => {
  let authService: AuthService;
  const testPhone = '+1234567890';
  const testName = 'Test User';

  beforeEach(() => {
    authService = new AuthService();
    // Clear any existing OTPs
    authService.cleanupExpiredOTPs();
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await supabase
        .from('users')
        .delete()
        .eq('phone', testPhone);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('register', () => {
    it('should successfully register a user and generate OTP', async () => {
      const result = await authService.register({
        name: testName,
        phoneNumber: testPhone
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent successfully');
    });

    it('should reject invalid phone numbers', async () => {
      await expect(authService.register({
        name: testName,
        phoneNumber: 'invalid-phone'
      })).rejects.toThrow('Invalid phone number format');
    });

    it('should reject short names', async () => {
      await expect(authService.register({
        name: 'A',
        phoneNumber: testPhone
      })).rejects.toThrow('Name must be at least 2 characters long');
    });

    it('should reject already registered users', async () => {
      // First, create a verified user
      await supabase
        .from('users')
        .insert({
          name: testName,
          phone: testPhone,
          is_verified: true
        });

      await expect(authService.register({
        name: testName,
        phoneNumber: testPhone
      })).rejects.toThrow('User already registered with this phone number');
    });
  });

  describe('verifyOTP', () => {
    it('should successfully verify OTP and create user', async () => {
      // First register to get OTP
      await authService.register({
        name: testName,
        phoneNumber: testPhone
      });

      // Get the OTP from the service (in real implementation, this would come from SMS)
      const otpData = (authService as any).otpStorage.get(testPhone.replace(/\s+/g, ''));
      expect(otpData).toBeDefined();

      const result = await authService.verifyOTP({
        phoneNumber: testPhone,
        otp: otpData.otp
      });

      expect(result.user).toBeDefined();
      expect(result.user.name).toBe(testName);
      expect(result.user.isVerified).toBe(true);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    it('should reject invalid OTP', async () => {
      await authService.register({
        name: testName,
        phoneNumber: testPhone
      });

      await expect(authService.verifyOTP({
        phoneNumber: testPhone,
        otp: '000000'
      })).rejects.toThrow('Invalid OTP');
    });

    it('should reject OTP for non-existent phone', async () => {
      await expect(authService.verifyOTP({
        phoneNumber: '+9999999999',
        otp: '123456'
      })).rejects.toThrow('OTP not found or expired');
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      // Create a user first
      const { data: user } = await supabase
        .from('users')
        .insert({
          name: testName,
          phone: testPhone,
          is_verified: true
        })
        .select('id')
        .single();

      if (!user) throw new Error('Failed to create test user');

      const token = authService.generateToken(user.id);
      const result = await authService.validateToken(token);

      expect(result.isValid).toBe(true);
      expect(result.userId).toBe(user.id);
    });

    it('should reject invalid token', async () => {
      const result = await authService.validateToken('invalid-token');

      expect(result.isValid).toBe(false);
      expect(result.userId).toBe('');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile without phone number', async () => {
      // Create a user first
      const { data: user } = await supabase
        .from('users')
        .insert({
          name: testName,
          phone: testPhone,
          is_verified: true
        })
        .select('id')
        .single();

      if (!user) throw new Error('Failed to create test user');

      const profile = await authService.getUserProfile(user.id);

      expect(profile).toBeDefined();
      expect(profile?.name).toBe(testName);
      expect(profile?.isVerified).toBe(true);
      expect((profile as any)?.phone).toBeUndefined(); // Phone should not be included
    });

    it('should return null for non-existent user', async () => {
      const profile = await authService.getUserProfile('non-existent-id');
      expect(profile).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh a valid token', async () => {
      // Create a user first
      const { data: user } = await supabase
        .from('users')
        .insert({
          name: testName,
          phone: testPhone,
          is_verified: true
        })
        .select('id')
        .single();

      if (!user) throw new Error('Failed to create test user');

      const originalToken = authService.generateToken(user.id);
      const newToken = await authService.refreshToken(originalToken);

      expect(newToken).toBeDefined();
      expect(typeof newToken).toBe('string');
      expect(newToken).not.toBe(originalToken);
    });

    it('should reject invalid token for refresh', async () => {
      const newToken = await authService.refreshToken('invalid-token');
      expect(newToken).toBeNull();
    });
  });

  describe('cleanupExpiredOTPs', () => {
    it('should remove expired OTPs', async () => {
      // Register a user to create an OTP
      await authService.register({
        name: testName,
        phoneNumber: testPhone
      });

      // Manually expire the OTP
      const otpStorage = (authService as any).otpStorage;
      const otpData = otpStorage.get(testPhone.replace(/\s+/g, ''));
      otpData.expiresAt = new Date(Date.now() - 1000); // 1 second ago

      // Cleanup should remove the expired OTP
      authService.cleanupExpiredOTPs();

      const remainingOtp = otpStorage.get(testPhone.replace(/\s+/g, ''));
      expect(remainingOtp).toBeUndefined();
    });
  });
});
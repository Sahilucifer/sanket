import jwt from 'jsonwebtoken';
import { supabase, supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import { User, RegisterRequest, OTPVerificationRequest, AuthResponse } from '../types';
import { TwilioService } from './twilioService';

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly otpStorage = new Map<string, { otp: string; expiresAt: Date; userData?: any }>();
  private readonly twilioService: TwilioService;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.twilioService = new TwilioService();
    
    if (!process.env.JWT_SECRET) {
      logger.warn('JWT_SECRET not set, using fallback secret');
    }
  }

  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phone: string): boolean {
    // Basic phone number validation - should be 10-15 digits
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  /**
   * Send OTP to phone number (for login or registration)
   */
  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.validatePhoneNumber(phone)) {
        throw new Error('Invalid phone number format');
      }

      // Normalize phone number
      const normalizedPhone = phone.replace(/\s+/g, '');

      // Check if user exists (use admin client to bypass RLS)
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id, name, is_verified')
        .eq('phone', normalizedPhone)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('Error checking existing user:', checkError);
        throw new Error('Database error occurred');
      }

      // Generate and store OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP with user data if user exists, or prepare for new user
      this.otpStorage.set(normalizedPhone, {
        otp,
        expiresAt,
        userData: existingUser ? { 
          id: existingUser.id, 
          name: existingUser.name, 
          phone: normalizedPhone,
          isExisting: true 
        } : { 
          phone: normalizedPhone,
          isExisting: false 
        }
      });

      // Send OTP via Twilio SMS
      try {
        const message = `Your verification code is: ${otp}. This code will expire in 10 minutes.`;
        await this.twilioService.sendSMS(normalizedPhone, message);
        logger.info(`OTP sent via SMS to phone: ${normalizedPhone}`);
        // For development - log OTP temporarily
        if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
          logger.info(`DEBUG - OTP for ${normalizedPhone}: ${otp}`);
        }
      } catch (smsError) {
        logger.error(`Failed to send SMS to ${normalizedPhone}:`, smsError);
        // For development, still log the OTP if SMS fails
        logger.info(`OTP for ${normalizedPhone}: ${otp} (SMS failed, showing for development)`);
      }
      
      return {
        success: true,
        message: 'OTP sent successfully'
      };

    } catch (error) {
      logger.error('Send OTP error:', error);
      throw error;
    }
  }

  /**
   * Register a new user and send OTP
   */
  async register(data: RegisterRequest): Promise<{ success: boolean; message: string }> {
    try {
      const { name, phoneNumber } = data;

      // Validate input
      if (!name || name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }

      if (!this.validatePhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Normalize phone number
      const normalizedPhone = phoneNumber.replace(/\s+/g, '');

      // Check if user already exists (use admin client to bypass RLS)
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id, is_verified')
        .eq('phone', normalizedPhone)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('Error checking existing user:', checkError);
        throw new Error('Database error occurred');
      }

      if (existingUser && existingUser.is_verified) {
        throw new Error('User already registered with this phone number');
      }

      // Generate and store OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      this.otpStorage.set(normalizedPhone, {
        otp,
        expiresAt,
        userData: { name: name.trim(), phone: normalizedPhone }
      });

      // Send OTP via Twilio SMS
      try {
        const message = `Your verification code is: ${otp}. This code will expire in 10 minutes.`;
        await this.twilioService.sendSMS(normalizedPhone, message);
        logger.info(`Registration OTP sent via SMS to phone: ${normalizedPhone}`);
        // For development - log OTP temporarily
        if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
          logger.info(`DEBUG - Registration OTP for ${normalizedPhone}: ${otp}`);
        }
      } catch (smsError) {
        logger.error(`Failed to send registration SMS to ${normalizedPhone}:`, smsError);
        // For development, still log the OTP if SMS fails
        logger.info(`OTP for ${normalizedPhone}: ${otp} (SMS failed, showing for development)`);
      }
      
      return {
        success: true,
        message: 'OTP sent successfully'
      };

    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Verify OTP and login/register user
   */
  async verifyOTP(data: OTPVerificationRequest): Promise<AuthResponse> {
    try {
      const { phoneNumber, otp } = data;
      const normalizedPhone = phoneNumber.replace(/\s+/g, '');

      // Check if OTP exists and is valid
      const otpData = this.otpStorage.get(normalizedPhone);
      if (!otpData) {
        throw new Error('OTP not found or expired');
      }

      if (otpData.expiresAt < new Date()) {
        this.otpStorage.delete(normalizedPhone);
        throw new Error('OTP has expired');
      }

      if (otpData.otp !== otp) {
        throw new Error('Invalid OTP');
      }

      let user;

      // Check if this is an existing user or new user
      if (otpData.userData.isExisting) {
        // Existing user - just get their data (use admin client to bypass RLS)
        const { data: existingUser, error } = await supabaseAdmin
          .from('users')
          .select('id, name, phone, is_verified, created_at, updated_at')
          .eq('id', otpData.userData.id)
          .single();

        if (error) {
          logger.error('Error fetching existing user:', error);
          throw new Error('Failed to authenticate user');
        }

        user = existingUser;
      } else {
        // New user - need to create account, but we need a name
        // For now, we'll create with a default name and let them update later
        const { data: newUser, error } = await supabaseAdmin
          .from('users')
          .insert({
            name: 'User', // Default name - user can update later
            phone: normalizedPhone,
            is_verified: true
          })
          .select('id, name, phone, is_verified, created_at, updated_at')
          .single();

        if (error) {
          logger.error('Error creating new user:', error);
          throw new Error('Failed to create user account');
        }

        user = newUser;
      }

      // Clean up OTP
      this.otpStorage.delete(normalizedPhone);

      // Generate JWT token
      const token = this.generateToken(user.id);

      logger.info(`User verified and created: ${user.id}`);

      return {
        user: {
          id: user.id,
          name: user.name,
          isVerified: user.is_verified,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at)
        },
        token
      };

    } catch (error) {
      logger.error('OTP verification error:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'access' },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn } as jwt.SignOptions
    );
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<{ userId: string; isValid: boolean }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Verify user still exists and is verified (use admin client to bypass RLS)
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, is_verified')
        .eq('id', decoded.userId)
        .single();

      if (error || !user || !user.is_verified) {
        return { userId: decoded.userId, isValid: false };
      }

      return { userId: decoded.userId, isValid: true };

    } catch (error) {
      logger.error('Token validation error:', error);
      return { userId: '', isValid: false };
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<Omit<User, 'phone'> | null> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, name, is_verified, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        isVerified: user.is_verified,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at)
      };

    } catch (error) {
      logger.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(oldToken: string): Promise<string | null> {
    try {
      const { userId, isValid } = await this.validateToken(oldToken);
      
      if (!isValid) {
        return null;
      }

      return this.generateToken(userId);

    } catch (error) {
      logger.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Clean up expired OTPs (should be called periodically)
   */
  cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [phone, data] of this.otpStorage.entries()) {
      if (data.expiresAt < now) {
        this.otpStorage.delete(phone);
      }
    }
  }
}

export const authService = new AuthService();
import api, { ApiResponse, setToken, removeToken } from '@/lib/api';

export interface LoginRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    phone: string;
    is_verified: boolean;
  };
}

export class AuthService {
  // Send OTP for login/registration
  static async sendOtp(phone: string): Promise<ApiResponse> {
    try {
      const response = await api.post('/auth/send-otp', { phone });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  }

  // Verify OTP and get auth token
  static async verifyOtp(phone: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/verify-otp', { phoneNumber: phone, otp });
      const authData = response.data.data;
      
      // Store token in localStorage
      if (authData.token) {
        setToken(authData.token);
      }
      
      return authData;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to verify OTP');
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Always remove token from localStorage
      removeToken();
    }
  }

  // Get current user profile
  static async getProfile(): Promise<AuthResponse['user']> {
    try {
      const response = await api.get('/auth/profile');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('auth_token');
    return !!token;
  }
}
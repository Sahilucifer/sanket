import { Request, Response } from 'express';
import Joi from 'joi';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';
import { RegisterRequest, OTPVerificationRequest, ApiResponse } from '../types';

// Validation schemas
const phoneSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required()
    .messages({
      'string.pattern.base': 'Invalid phone number format',
      'any.required': 'Phone number is required'
    })
});

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required'
    }),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required()
    .messages({
      'string.pattern.base': 'Invalid phone number format',
      'any.required': 'Phone number is required'
    })
});

const otpVerificationSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required()
    .messages({
      'string.pattern.base': 'Invalid phone number format',
      'any.required': 'Phone number is required'
    }),
  otp: Joi.string().length(6).pattern(/^\d+$/).required()
    .messages({
      'string.length': 'OTP must be 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'any.required': 'OTP is required'
    })
});

const refreshTokenSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'any.required': 'Token is required'
    })
});

/**
 * Send OTP to phone number (for login or registration)
 */
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = phoneSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          message: error.details[0]?.message || 'Validation error',
          code: 'VALIDATION_ERROR'
        }
      } as ApiResponse);
      return;
    }

    const { phone } = value;
    
    // Generate and send OTP (works for both new and existing users)
    const result = await authService.sendOTP(phone);

    logger.info(`OTP sent to phone: ${phone}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: result
    } as ApiResponse);

  } catch (error) {
    logger.error('Send OTP controller error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';

    res.status(400).json({
      success: false,
      error: {
        message: errorMessage,
        code: 'OTP_SEND_ERROR'
      }
    } as ApiResponse);
  }
};

/**
 * Register a new user and send OTP
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          message: error.details[0]?.message || 'Validation error',
          code: 'VALIDATION_ERROR'
        }
      } as ApiResponse);
      return;
    }

    const registerData: RegisterRequest = value;
    const result = await authService.register(registerData);

    logger.info(`Registration request processed for phone: ${registerData.phoneNumber}`);

    res.status(200).json({
      success: true,
      data: result
    } as ApiResponse);

  } catch (error) {
    logger.error('Registration controller error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    const statusCode = errorMessage.includes('already registered') ? 409 : 400;

    res.status(statusCode).json({
      success: false,
      error: {
        message: errorMessage,
        code: 'REGISTRATION_ERROR'
      }
    } as ApiResponse);
  }
};

/**
 * Verify OTP and complete user registration
 */
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = otpVerificationSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          message: error.details[0]?.message || 'Validation error',
          code: 'VALIDATION_ERROR'
        }
      } as ApiResponse);
      return;
    }

    const otpData: OTPVerificationRequest = value;
    const result = await authService.verifyOTP(otpData);

    logger.info(`OTP verified successfully for user: ${result.user.id}`);

    res.status(200).json({
      success: true,
      data: result
    } as ApiResponse);

  } catch (error) {
    logger.error('OTP verification controller error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
    const statusCode = errorMessage.includes('not found') || errorMessage.includes('expired') || errorMessage.includes('Invalid') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        message: errorMessage,
        code: 'OTP_VERIFICATION_ERROR'
      }
    } as ApiResponse);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        }
      } as ApiResponse);
      return;
    }

    const userProfile = await authService.getUserProfile(req.user.userId);

    if (!userProfile) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: userProfile
    } as ApiResponse);

  } catch (error) {
    logger.error('Get profile controller error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch user profile',
        code: 'PROFILE_ERROR'
      }
    } as ApiResponse);
  }
};

/**
 * Refresh JWT token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          message: error.details[0]?.message || 'Validation error',
          code: 'VALIDATION_ERROR'
        }
      } as ApiResponse);
      return;
    }

    const { token } = value;
    const newToken = await authService.refreshToken(token);

    if (!newToken) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: { token: newToken }
    } as ApiResponse);

  } catch (error) {
    logger.error('Refresh token controller error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Token refresh failed',
        code: 'TOKEN_REFRESH_ERROR'
      }
    } as ApiResponse);
  }
};

/**
 * Logout (client-side token removal, server-side cleanup if needed)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a stateless JWT implementation, logout is primarily client-side
    // The client should remove the token from storage
    // Here we can log the logout event and perform any cleanup

    if (req.user?.userId) {
      logger.info(`User logged out: ${req.user.userId}`);
    }

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' }
    } as ApiResponse);

  } catch (error) {
    logger.error('Logout controller error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Logout failed',
        code: 'LOGOUT_ERROR'
      }
    } as ApiResponse);
  }
};
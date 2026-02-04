import { Router } from 'express';
import { register, verifyOTP, getProfile, refreshToken, logout, sendOTP } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to phone number (for login or registration)
 * @access  Public
 */
router.post('/send-otp', sendOTP);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and send OTP
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and complete user registration/login
 * @access  Public
 */
router.post('/verify-otp', verifyOTP);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

export default router;
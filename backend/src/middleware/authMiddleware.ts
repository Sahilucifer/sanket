import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Validates JWT token and adds user info to request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Access token required',
          code: 'MISSING_TOKEN'
        }
      });
      return;
    }

    const { userId, isValid } = await authService.validateToken(token);

    if (!isValid) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }
      });
      return;
    }

    // Add user info to request
    req.user = { userId };
    next();

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR'
      }
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is valid, but doesn't block request if not
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { userId, isValid } = await authService.validateToken(token);
      if (isValid) {
        req.user = { userId };
      }
    }

    next();

  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    // Continue without authentication
    next();
  }
};
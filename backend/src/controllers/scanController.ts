import { Request, Response } from 'express';
import { scanService } from '../services/scanService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

/**
 * Get vehicle information for scan page
 * Public endpoint - no authentication required
 * Ensures privacy protection by not exposing personal information
 */
export const getVehicleForScan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;

    if (!vehicleId || typeof vehicleId !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid vehicle ID provided',
          code: 'INVALID_VEHICLE_ID'
        }
      } as ApiResponse);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(vehicleId)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid vehicle ID format',
          code: 'INVALID_VEHICLE_ID_FORMAT'
        }
      } as ApiResponse);
      return;
    }

    // Get client IP address (handle various proxy scenarios)
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] as string ||
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress ||
                     (req.connection as any)?.socket?.remoteAddress ||
                     req.ip ||
                     null;

    // Get user agent
    const userAgent = req.headers['user-agent'] || null;

    // Get vehicle information
    const vehicle = await scanService.getVehicleForScan(vehicleId);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Vehicle not found. This QR code may be invalid or the vehicle may have been deactivated.',
          code: 'VEHICLE_NOT_FOUND'
        }
      } as ApiResponse);
      return;
    }

    // Log the scan event (don't fail the request if logging fails)
    try {
      await scanService.logScan(vehicleId, ipAddress, userAgent);
      logger.info(`Scan logged for vehicle ${vehicleId} from IP ${ipAddress}`);
    } catch (logError) {
      // Don't fail the request if logging fails, just log the error
      logger.error('Failed to log scan event:', logError);
    }

    // Return vehicle information with strict privacy protection
    // Only expose the minimum necessary information
    res.json({
      success: true,
      data: {
        vehicle_id: vehicle.id,
        car_number: vehicle.carNumber,
        is_active: vehicle.isActive,
        // Explicitly NOT including:
        // - userId (owner information)
        // - qrUrl (not needed for scan page)
        // - owner phone number
        // - owner name
        // - any other personal information
        scanTimestamp: new Date().toISOString()
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('Error in getVehicleForScan:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Unable to process request. Please try again later.',
        code: 'INTERNAL_ERROR'
      }
    } as ApiResponse);
  }
};

/**
 * Get scan logs for a vehicle (authenticated endpoint for vehicle owners)
 */
export const getScanLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!vehicleId || typeof vehicleId !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Vehicle ID is required',
          code: 'MISSING_VEHICLE_ID'
        }
      } as ApiResponse);
      return;
    }

    // TODO: Add authorization check to ensure user owns the vehicle
    // This will be implemented when we have proper vehicle ownership validation

    const logs = await scanService.getScanLogs(vehicleId, limit);

    res.json({
      success: true,
      data: {
        logs,
        count: logs.length
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('Error in getScanLogs:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    } as ApiResponse);
  }
};

/**
 * Get scan logs with advanced filtering (authenticated endpoint for admins/owners)
 */
export const getScanLogsWithFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId, startDate, endDate, ipAddress, limit = '50', offset = '0' } = req.query;

    const parsedLimit = parseInt(limit as string) || 50;
    const parsedOffset = parseInt(offset as string) || 0;
    const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

    // Validate dates
    if (startDate && isNaN(parsedStartDate!.getTime())) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid start date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
          code: 'INVALID_START_DATE'
        }
      } as ApiResponse);
      return;
    }

    if (endDate && isNaN(parsedEndDate!.getTime())) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid end date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
          code: 'INVALID_END_DATE'
        }
      } as ApiResponse);
      return;
    }

    // Validate limit and offset
    if (parsedLimit < 1 || parsedLimit > 1000) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Limit must be between 1 and 1000',
          code: 'INVALID_LIMIT'
        }
      } as ApiResponse);
      return;
    }

    if (parsedOffset < 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Offset must be non-negative',
          code: 'INVALID_OFFSET'
        }
      } as ApiResponse);
      return;
    }

    const result = await scanService.getScanLogsWithFilters(
      vehicleId as string,
      parsedStartDate,
      parsedEndDate,
      ipAddress as string,
      parsedLimit,
      parsedOffset
    );

    res.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        analytics: result.analytics,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: result.total > parsedOffset + parsedLimit
        }
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('Error in getScanLogsWithFilters:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    } as ApiResponse);
  }
};

/**
 * Get scan statistics for a specific vehicle
 */
export const getVehicleScanStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;

    if (!vehicleId || typeof vehicleId !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Vehicle ID is required',
          code: 'MISSING_VEHICLE_ID'
        }
      } as ApiResponse);
      return;
    }

    // TODO: Add authorization check to ensure user owns the vehicle
    // This will be implemented when we have proper vehicle ownership validation

    const stats = await scanService.getVehicleScanStats(vehicleId);

    res.json({
      success: true,
      data: stats
    } as ApiResponse);

  } catch (error) {
    logger.error('Error in getVehicleScanStats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    } as ApiResponse);
  }
};
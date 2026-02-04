import { Request, Response } from 'express';
import { logService, LogQueryFilters } from '../services/logService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

export class LogController {
  /**
   * Get call logs with filtering and pagination
   * GET /api/logs/calls
   */
  async getCallLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters: LogQueryFilters = {};
      
      if (req.query.vehicleId) filters.vehicleId = req.query.vehicleId as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string);

      logger.info('Getting call logs', { filters });

      const result = await logService.queryCallLogs(filters);

      // Remove sensitive phone numbers from response
      const sanitizedData = result.data.map(log => ({
        ...log,
        callerNumber: this.maskPhoneNumber(log.callerNumber),
        ownerNumber: this.maskPhoneNumber(log.ownerNumber),
      }));

      const response: ApiResponse = {
        success: true,
        data: {
          logs: sanitizedData,
          pagination: {
            total: result.total,
            hasMore: result.hasMore,
            limit: filters.limit || 50,
            offset: filters.offset || 0,
          },
        },
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error getting call logs', { error: error.message, query: req.query });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to retrieve call logs',
          code: 'CALL_LOGS_ERROR',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get alert logs with filtering and pagination
   * GET /api/logs/alerts
   */
  async getAlertLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters: LogQueryFilters = {};
      
      if (req.query.vehicleId) filters.vehicleId = req.query.vehicleId as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string);

      logger.info('Getting alert logs', { filters });

      const result = await logService.queryAlertLogs(filters);

      const response: ApiResponse = {
        success: true,
        data: {
          logs: result.data,
          pagination: {
            total: result.total,
            hasMore: result.hasMore,
            limit: filters.limit || 50,
            offset: filters.offset || 0,
          },
        },
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error getting alert logs', { error: error.message, query: req.query });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to retrieve alert logs',
          code: 'ALERT_LOGS_ERROR',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get scan logs with filtering and pagination
   * GET /api/logs/scans
   */
  async getScanLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters: LogQueryFilters = {};
      
      if (req.query.vehicleId) filters.vehicleId = req.query.vehicleId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string);

      logger.info('Getting scan logs', { filters });

      const result = await logService.queryScanLogs(filters);

      const response: ApiResponse = {
        success: true,
        data: {
          logs: result.data,
          pagination: {
            total: result.total,
            hasMore: result.hasMore,
            limit: filters.limit || 50,
            offset: filters.offset || 0,
          },
        },
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error getting scan logs', { error: error.message, query: req.query });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to retrieve scan logs',
          code: 'SCAN_LOGS_ERROR',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get comprehensive logs for a specific vehicle
   * GET /api/logs/vehicle/:vehicleId
   */
  async getVehicleLogs(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      
      if (!vehicleId || typeof vehicleId !== 'string') {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Invalid vehicle ID',
            code: 'INVALID_VEHICLE_ID',
          },
        };
        res.status(400).json(response);
        return;
      }
      
      const filters: Omit<LogQueryFilters, 'vehicleId'> = {};
      
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string);

      logger.info('Getting vehicle logs', { vehicleId, filters });

      const result = await logService.getVehicleLogs(vehicleId, filters);

      // Sanitize call logs to remove phone numbers
      const sanitizedCallLogs = {
        ...result.callLogs,
        data: result.callLogs.data.map(log => ({
          ...log,
          callerNumber: this.maskPhoneNumber(log.callerNumber),
          ownerNumber: this.maskPhoneNumber(log.ownerNumber),
        })),
      };

      const response: ApiResponse = {
        success: true,
        data: {
          ...result,
          callLogs: sanitizedCallLogs,
        },
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error getting vehicle logs', { 
        error: error.message, 
        vehicleId: req.params.vehicleId,
        query: req.query 
      });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to retrieve vehicle logs',
          code: 'VEHICLE_LOGS_ERROR',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get log statistics and analytics
   * GET /api/logs/stats
   */
  async getLogStats(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.query;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      logger.info('Getting log statistics', { vehicleId, startDate, endDate });

      const filters: LogQueryFilters = { vehicleId: vehicleId as string };
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const [callStats, alertStats, scanStats] = await Promise.all([
        logService.queryCallLogs({ ...filters, limit: 1 }),
        logService.queryAlertLogs({ ...filters, limit: 1 }),
        logService.queryScanLogs({ ...filters, limit: 1 }),
      ]);

      const stats = {
        totalCalls: callStats.total,
        totalAlerts: alertStats.total,
        totalScans: scanStats.total,
        period: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      };

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error getting log statistics', { error: error.message, query: req.query });
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to retrieve log statistics',
          code: 'LOG_STATS_ERROR',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * Mask phone number for privacy protection
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.length < 4) {
      return '****';
    }
    return '*'.repeat(phoneNumber.length - 4) + phoneNumber.slice(-4);
  }
}

export const logController = new LogController();
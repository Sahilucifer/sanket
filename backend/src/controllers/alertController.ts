import { Request, Response } from 'express';
import { alertService } from '../services/alertService';
import { logger } from '../utils/logger';
import { ApiResponse, EmergencyAlertRequest } from '../types';
import Joi from 'joi';

// Validation schemas
const emergencyAlertSchema = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  templateId: Joi.string().optional(),
  customMessage: Joi.string().max(500).optional(),
  message: Joi.string().max(500).optional(),
  customizations: Joi.object({
    vehicleInfo: Joi.string().max(100).optional(),
    location: Joi.string().max(200).optional(),
    contactInfo: Joi.string().max(100).optional(),
    urgencyLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  }).optional(),
});

const validateMessageSchema = Joi.object({
  message: Joi.string().required(),
});

export class AlertController {
  /**
   * Send emergency alert (call + SMS)
   * POST /api/alert/emergency
   */
  async sendEmergencyAlert(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Emergency alert request received', {
        body: req.body,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Validate request body
      const { error, value } = emergencyAlertSchema.validate(req.body);
      if (error) {
        logger.warn('Invalid emergency alert request', {
          error: error.details?.[0]?.message || 'Validation error',
          body: req.body,
        });

        const response: ApiResponse = {
          success: false,
          error: {
            message: error.details?.[0]?.message || 'Validation error',
            code: 'VALIDATION_ERROR',
          },
        };

        res.status(400).json(response);
        return;
      }

      const { vehicle_id: vehicleId, templateId, customMessage, message, customizations } = value;

      // Validate custom message if provided
      if (customMessage) {
        const messageValidation = alertService.validateCustomMessage(customMessage);
        if (!messageValidation.isValid) {
          logger.warn('Invalid custom message', {
            error: messageValidation.error,
            vehicleId,
          });

          const response: ApiResponse = {
            success: false,
            error: {
              message: messageValidation.error || 'Invalid custom message',
              code: 'INVALID_MESSAGE',
            },
          };

          res.status(400).json(response);
          return;
        }
      }

      // Send emergency alert
      const finalMessage = customMessage || message;
      const result = await alertService.sendEmergencyAlert(vehicleId, templateId, finalMessage, customizations);

      if (result.status === 'sent') {
        logger.info('Emergency alert sent successfully', {
          vehicleId,
          alertId: result.alertId,
        });

        const response: ApiResponse = {
          success: true,
          data: {
            alertId: result.alertId,
            status: result.status,
            message: result.message,
          },
        };

        res.status(200).json(response);
      } else {
        logger.error('Emergency alert failed', {
          vehicleId,
          error: result.message,
        });

        const response: ApiResponse = {
          success: false,
          error: {
            message: result.message,
            code: 'ALERT_FAILED',
          },
        };

        res.status(500).json(response);
      }

    } catch (error: any) {
      logger.error('Exception in emergency alert endpoint', {
        error: error.message,
        stack: error.stack,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get available message templates
   * GET /api/alert/templates
   */
  async getMessageTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { category, severity } = req.query;

      logger.info('Message templates request received', {
        category,
        severity,
      });

      let templates;

      if (category) {
        templates = alertService.getMessageTemplatesByCategory(category as any);
      } else if (severity) {
        templates = alertService.getMessageTemplatesBySeverity(severity as any);
      } else {
        templates = alertService.getMessageTemplates();
      }

      const response: ApiResponse = {
        success: true,
        data: {
          templates,
          stats: alertService.getTemplateStats(),
        },
      };

      res.status(200).json(response);

    } catch (error: any) {
      logger.error('Exception in message templates endpoint', {
        error: error.message,
        stack: error.stack,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * Validate custom message
   * POST /api/alert/validate-message
   */
  async validateMessage(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Message validation request received');

      // Validate request body
      const { error, value } = validateMessageSchema.validate(req.body);
      if (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: error.details?.[0]?.message || 'Validation error',
            code: 'VALIDATION_ERROR',
          },
        };

        res.status(400).json(response);
        return;
      }

      const { message } = value;
      const validation = alertService.validateCustomMessage(message);

      const response: ApiResponse = {
        success: true,
        data: {
          isValid: validation.isValid,
          error: validation.error,
          messageLength: message.length,
          maxLength: 500,
        },
      };

      res.status(200).json(response);

    } catch (error: any) {
      logger.error('Exception in message validation endpoint', {
        error: error.message,
        stack: error.stack,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get alert logs for a vehicle
   * GET /api/alert/logs/:vehicleId
   */
  async getAlertLogs(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Array.isArray(req.params.vehicleId) ? req.params.vehicleId[0] : req.params.vehicleId;

      logger.info('Alert logs request received', {
        vehicleId,
        userId: (req as any).user?.id,
      });

      // Validate vehicle ID format
      if (!vehicleId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vehicleId)) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Invalid vehicle ID format',
            code: 'VALIDATION_ERROR',
          },
        };

        res.status(400).json(response);
        return;
      }

      // Get alert logs
      const logs = await alertService.getAlertLogs(vehicleId);

      const response: ApiResponse = {
        success: true,
        data: {
          logs,
        },
      };

      res.status(200).json(response);

    } catch (error: any) {
      logger.error('Exception in alert logs endpoint', {
        error: error.message,
        stack: error.stack,
        vehicleId: req.params.vehicleId,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * Handle emergency call webhook
   * POST /api/alert/webhook/emergency-call
   */
  async handleEmergencyCallWebhook(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Emergency call webhook received', {
        body: req.body,
        headers: req.headers,
      });

      // This endpoint would handle status updates from call providers
      // For now, we'll just acknowledge receipt
      res.status(200).json({ success: true, message: 'Webhook received' });

    } catch (error: any) {
      logger.error('Exception in emergency call webhook', {
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Handle emergency SMS webhook
   * POST /api/alert/webhook/emergency-sms
   */
  async handleEmergencySMSWebhook(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Emergency SMS webhook received', {
        body: req.body,
        headers: req.headers,
      });

      // This endpoint would handle status updates from SMS providers
      // For now, we'll just acknowledge receipt
      res.status(200).json({ success: true, message: 'Webhook received' });

    } catch (error: any) {
      logger.error('Exception in emergency SMS webhook', {
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Get alert statistics
   * GET /api/alert/stats/:vehicleId
   */
  async getAlertStats(req: Request, res: Response): Promise<void> {
    try {
      const vehicleId = Array.isArray(req.params.vehicleId) ? req.params.vehicleId[0] : req.params.vehicleId;
      const { startDate, endDate } = req.query;

      logger.info('Alert stats request received', {
        vehicleId,
        startDate,
        endDate,
        userId: (req as any).user?.id,
      });

      // Validate vehicle ID format
      if (!vehicleId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vehicleId)) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Invalid vehicle ID format',
            code: 'VALIDATION_ERROR',
          },
        };

        res.status(400).json(response);
        return;
      }

      // Parse date range if provided
      let timeRange;
      if (startDate && endDate) {
        timeRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };

        // Validate dates
        if (isNaN(timeRange.start.getTime()) || isNaN(timeRange.end.getTime())) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: 'Invalid date format',
              code: 'VALIDATION_ERROR',
            },
          };

          res.status(400).json(response);
          return;
        }
      }

      // Get alert statistics
      const stats = await alertService.getAlertStats(vehicleId, timeRange);

      const response: ApiResponse = {
        success: true,
        data: {
          vehicleId,
          timeRange,
          stats,
        },
      };

      res.status(200).json(response);

    } catch (error: any) {
      logger.error('Exception in alert stats endpoint', {
        error: error.message,
        stack: error.stack,
        vehicleId: req.params.vehicleId,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      };

      res.status(500).json(response);
    }
  }
}

// Export singleton instance
export const alertController = new AlertController();
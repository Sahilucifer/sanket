import Joi from 'joi';
import { logger } from '../utils/logger';
import { callService } from './callService';

// Validation schemas for external service responses
const exotelCallResponseSchema = Joi.object({
  Call: Joi.object({
    Sid: Joi.string().required(),
    Status: Joi.string().valid('queued', 'ringing', 'in-progress', 'completed', 'busy', 'failed', 'no-answer', 'canceled').required(),
    From: Joi.string().optional(),
    To: Joi.string().optional(),
    Duration: Joi.number().optional(),
    StartTime: Joi.string().optional(),
    EndTime: Joi.string().optional(),
  }).required(),
}).unknown(true);

const exotelSMSResponseSchema = Joi.object({
  SMSMessage: Joi.object({
    Sid: Joi.string().required(),
    Status: Joi.string().valid('queued', 'sending', 'sent', 'failed', 'delivered', 'undelivered').required(),
    From: Joi.string().optional(),
    To: Joi.string().optional(),
    Body: Joi.string().optional(),
  }).required(),
}).unknown(true);

const twilioCallResponseSchema = Joi.object({
  sid: Joi.string().required(),
  status: Joi.string().valid('queued', 'ringing', 'in-progress', 'completed', 'busy', 'failed', 'no-answer', 'canceled').required(),
  from: Joi.string().optional(),
  to: Joi.string().optional(),
  duration: Joi.string().optional(),
  start_time: Joi.string().optional(),
  end_time: Joi.string().optional(),
}).unknown(true);

const twilioSMSResponseSchema = Joi.object({
  sid: Joi.string().required(),
  status: Joi.string().valid('queued', 'sending', 'sent', 'failed', 'delivered', 'undelivered').required(),
  from: Joi.string().optional(),
  to: Joi.string().optional(),
  body: Joi.string().optional(),
}).unknown(true);

// Webhook validation schemas
const exotelWebhookSchema = Joi.object({
  CallSid: Joi.string().required(),
  CallStatus: Joi.string().required(),
  CallDuration: Joi.string().optional(),
  From: Joi.string().optional(),
  To: Joi.string().optional(),
  Direction: Joi.string().optional(),
  StartTime: Joi.string().optional(),
  EndTime: Joi.string().optional(),
}).unknown(true);

const twilioWebhookSchema = Joi.object({
  CallSid: Joi.string().required(),
  CallStatus: Joi.string().required(),
  CallDuration: Joi.string().optional(),
  From: Joi.string().optional(),
  To: Joi.string().optional(),
  Direction: Joi.string().optional(),
  StartTime: Joi.string().optional(),
  EndTime: Joi.string().optional(),
}).unknown(true);

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedData?: any;
}

export interface QuotaStatus {
  provider: string;
  quotaExceeded: boolean;
  remainingCalls?: number;
  remainingSMS?: number;
  resetTime?: Date;
}

export interface ServiceError {
  provider: string;
  errorType: 'quota_exceeded' | 'authentication_failed' | 'invalid_number' | 'service_unavailable' | 'unknown';
  message: string;
  shouldRetry: boolean;
  retryAfter?: number; // seconds
}

export class ServiceValidator {
  private quotaThresholds = {
    callsPerHour: parseInt(process.env.QUOTA_CALLS_PER_HOUR || '100'),
    smsPerHour: parseInt(process.env.QUOTA_SMS_PER_HOUR || '200'),
    callsPerDay: parseInt(process.env.QUOTA_CALLS_PER_DAY || '1000'),
    smsPerDay: parseInt(process.env.QUOTA_SMS_PER_DAY || '2000'),
  };

  private adminNotificationEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || '').split(',').filter(Boolean);

  /**
   * Validate Exotel call response
   */
  validateExotelCallResponse(response: any): ValidationResult {
    try {
      const { error, value } = exotelCallResponseSchema.validate(response);
      
      if (error) {
        logger.error('Exotel call response validation failed', {
          error: error.details?.[0]?.message || 'Validation failed',
          response,
        });
        return {
          isValid: false,
          error: `Invalid Exotel call response: ${error.details?.[0]?.message || 'Validation failed'}`,
        };
      }

      return {
        isValid: true,
        sanitizedData: value,
      };
    } catch (err: any) {
      logger.error('Exception during Exotel call response validation', { error: err.message });
      return {
        isValid: false,
        error: 'Validation exception occurred',
      };
    }
  }

  /**
   * Validate Exotel SMS response
   */
  validateExotelSMSResponse(response: any): ValidationResult {
    try {
      const { error, value } = exotelSMSResponseSchema.validate(response);
      
      if (error) {
        logger.error('Exotel SMS response validation failed', {
          error: error.details?.[0]?.message || 'Validation failed',
          response,
        });
        return {
          isValid: false,
          error: `Invalid Exotel SMS response: ${error.details?.[0]?.message || 'Validation failed'}`,
        };
      }

      return {
        isValid: true,
        sanitizedData: value,
      };
    } catch (err: any) {
      logger.error('Exception during Exotel SMS response validation', { error: err.message });
      return {
        isValid: false,
        error: 'Validation exception occurred',
      };
    }
  }

  /**
   * Validate Twilio call response
   */
  validateTwilioCallResponse(response: any): ValidationResult {
    try {
      const { error, value } = twilioCallResponseSchema.validate(response);
      
      if (error) {
        logger.error('Twilio call response validation failed', {
          error: error.details?.[0]?.message || 'Validation failed',
          response,
        });
        return {
          isValid: false,
          error: `Invalid Twilio call response: ${error.details?.[0]?.message || 'Validation failed'}`,
        };
      }

      return {
        isValid: true,
        sanitizedData: value,
      };
    } catch (err: any) {
      logger.error('Exception during Twilio call response validation', { error: err.message });
      return {
        isValid: false,
        error: 'Validation exception occurred',
      };
    }
  }

  /**
   * Validate Twilio SMS response
   */
  validateTwilioSMSResponse(response: any): ValidationResult {
    try {
      const { error, value } = twilioSMSResponseSchema.validate(response);
      
      if (error) {
        logger.error('Twilio SMS response validation failed', {
          error: error.details?.[0]?.message || 'Validation failed',
          response,
        });
        return {
          isValid: false,
          error: `Invalid Twilio SMS response: ${error.details?.[0]?.message || 'Validation failed'}`,
        };
      }

      return {
        isValid: true,
        sanitizedData: value,
      };
    } catch (err: any) {
      logger.error('Exception during Twilio SMS response validation', { error: err.message });
      return {
        isValid: false,
        error: 'Validation exception occurred',
      };
    }
  }

  /**
   * Validate webhook data
   */
  validateWebhookData(provider: 'exotel' | 'twilio', data: any): ValidationResult {
    try {
      const schema = provider === 'exotel' ? exotelWebhookSchema : twilioWebhookSchema;
      const { error, value } = schema.validate(data);
      
      if (error) {
        logger.error(`${provider} webhook validation failed`, {
          error: error.details?.[0]?.message || 'Validation failed',
          data,
        });
        return {
          isValid: false,
          error: `Invalid ${provider} webhook data: ${error.details?.[0]?.message || 'Validation failed'}`,
        };
      }

      return {
        isValid: true,
        sanitizedData: value,
      };
    } catch (err: any) {
      logger.error(`Exception during ${provider} webhook validation`, { error: err.message });
      return {
        isValid: false,
        error: 'Validation exception occurred',
      };
    }
  }

  /**
   * Parse and categorize service errors
   */
  parseServiceError(provider: string, error: any): ServiceError {
    const errorMessage = error.message || error.error || 'Unknown error';
    const errorCode = error.code || error.error_code || '';
    const statusCode = error.status || error.statusCode || 0;

    let errorType: ServiceError['errorType'] = 'unknown';
    let shouldRetry = false;
    let retryAfter: number | undefined;

    // Categorize errors based on common patterns
    if (errorMessage.toLowerCase().includes('quota') || 
        errorMessage.toLowerCase().includes('limit') ||
        statusCode === 429) {
      errorType = 'quota_exceeded';
      shouldRetry = true;
      retryAfter = 3600; // Retry after 1 hour for quota issues
    } else if (errorMessage.toLowerCase().includes('auth') || 
               errorMessage.toLowerCase().includes('unauthorized') ||
               statusCode === 401 || statusCode === 403) {
      errorType = 'authentication_failed';
      shouldRetry = false;
    } else if (errorMessage.toLowerCase().includes('invalid') && 
               errorMessage.toLowerCase().includes('number')) {
      errorType = 'invalid_number';
      shouldRetry = false;
    } else if (statusCode >= 500 || 
               errorMessage.toLowerCase().includes('service unavailable') ||
               errorMessage.toLowerCase().includes('timeout')) {
      errorType = 'service_unavailable';
      shouldRetry = true;
      retryAfter = 60; // Retry after 1 minute for service issues
    }

    logger.error('Service error categorized', {
      provider,
      errorType,
      shouldRetry,
      retryAfter,
      originalError: errorMessage,
    });

    return {
      provider,
      errorType,
      message: errorMessage,
      shouldRetry,
      ...(retryAfter && { retryAfter }),
    };
  }

  /**
   * Check quota status for a provider
   */
  async checkQuotaStatus(provider: string): Promise<QuotaStatus> {
    // This would typically query a database or cache to track usage
    // For now, we'll implement a basic check based on service health
    try {
      const healthCheck = await callService.checkServiceHealth();
      const providerHealth = healthCheck.providers[provider as keyof typeof healthCheck.providers];

      if (!providerHealth || !providerHealth.healthy) {
        // If service is unhealthy, assume quota might be exceeded
        return {
          provider,
          quotaExceeded: true,
          resetTime: new Date(Date.now() + 3600000), // Reset in 1 hour
        };
      }

      return {
        provider,
        quotaExceeded: false,
        remainingCalls: this.quotaThresholds.callsPerHour,
        remainingSMS: this.quotaThresholds.smsPerHour,
      };
    } catch (error: any) {
      logger.error('Failed to check quota status', { provider, error: error.message });
      return {
        provider,
        quotaExceeded: true,
        resetTime: new Date(Date.now() + 3600000),
      };
    }
  }

  /**
   * Handle quota exceeded scenarios
   */
  async handleQuotaExceeded(provider: string, quotaType: 'calls' | 'sms'): Promise<void> {
    logger.error('Quota exceeded', { provider, quotaType });

    // Send notification to administrators
    await this.notifyAdministrators(
      `Quota Exceeded: ${provider}`,
      `The ${quotaType} quota for ${provider} has been exceeded. Please check the service configuration and usage.`
    );

    // Log detailed quota information
    const quotaStatus = await this.checkQuotaStatus(provider);
    logger.error('Detailed quota status', { provider, quotaStatus });
  }

  /**
   * Send notifications to administrators
   */
  private async notifyAdministrators(subject: string, message: string): Promise<void> {
    try {
      if (this.adminNotificationEmails.length === 0) {
        logger.warn('No admin notification emails configured');
        return;
      }

      // In a real implementation, this would send emails
      // For now, we'll just log the notification
      logger.error('ADMIN NOTIFICATION', {
        subject,
        message,
        recipients: this.adminNotificationEmails,
        timestamp: new Date().toISOString(),
      });

      // You could integrate with an email service here
      // await emailService.sendNotification(this.adminNotificationEmails, subject, message);
    } catch (error: any) {
      logger.error('Failed to send admin notification', {
        error: error.message,
        subject,
      });
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): ValidationResult {
    const phoneSchema = Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be in international format',
      });

    const { error, value } = phoneSchema.validate(phoneNumber);

    if (error) {
      return {
        isValid: false,
        error: error.details?.[0]?.message || 'Phone number validation failed',
      };
    }

    return {
      isValid: true,
      sanitizedData: value,
    };
  }

  /**
   * Sanitize and validate message content
   */
  validateMessageContent(message: string): ValidationResult {
    const messageSchema = Joi.string()
      .min(1)
      .max(1600) // SMS character limit
      .required()
      .messages({
        'string.min': 'Message cannot be empty',
        'string.max': 'Message exceeds maximum length of 1600 characters',
      });

    const { error, value } = messageSchema.validate(message.trim());

    if (error) {
      return {
        isValid: false,
        error: error.details?.[0]?.message || 'Message validation failed',
      };
    }

    return {
      isValid: true,
      sanitizedData: value,
    };
  }

  /**
   * Get comprehensive service status
   */
  async getServiceStatus(): Promise<{
    overall: boolean;
    providers: Record<string, any>;
    quotas: Record<string, QuotaStatus>;
  }> {
    const healthCheck = await callService.checkServiceHealth();
    const quotas: Record<string, QuotaStatus> = {};

    // Check quotas for all providers
    for (const provider of ['exotel', 'twilio']) {
      quotas[provider] = await this.checkQuotaStatus(provider);
    }

    return {
      overall: healthCheck.overall,
      providers: healthCheck.providers,
      quotas,
    };
  }
}

// Export singleton instance
export const serviceValidator = new ServiceValidator();
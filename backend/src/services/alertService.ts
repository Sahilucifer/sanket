import { callService } from './callService';
import { vehicleService } from './vehicleService';
import { logger } from '../utils/logger';
import { supabase } from '../config/database';
import { AlertResult, AlertLog } from '../types';

export interface EmergencyAlertRequest {
  vehicleId: string;
  alertType?: 'emergency_call' | 'emergency_sms' | 'both';
}

export interface AlertRetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
  backoffMultiplier: number;
}

export interface AlertAttempt {
  attemptNumber: number;
  timestamp: Date;
  status: 'sent' | 'failed';
  error?: string | undefined;
  provider?: string | undefined;
}

export interface EmergencyMessageTemplate {
  id: string;
  name: string;
  description: string;
  callMessage: string;
  smsMessage: string;
  isDefault: boolean;
  category: 'general' | 'blocking' | 'medical' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AlertService {
  private retryConfig: AlertRetryConfig;
  private messageTemplates: EmergencyMessageTemplate[] = [
    {
      id: 'default_parking',
      name: 'Default Parking Alert',
      description: 'General purpose parking alert for non-urgent situations',
      callMessage: 'This is an emergency alert regarding your vehicle. Someone needs to contact you urgently about your parked vehicle. Please check your vehicle immediately.',
      smsMessage: 'EMERGENCY ALERT: Someone needs to contact you urgently about your parked vehicle. Please check your vehicle location immediately.',
      isDefault: true,
      category: 'general',
      severity: 'medium',
    },
    {
      id: 'blocking_emergency',
      name: 'Blocking Emergency Access',
      description: 'Vehicle is blocking emergency services or critical access',
      callMessage: 'URGENT: Your vehicle is blocking emergency access. Emergency services need immediate access. Please move your vehicle immediately to allow emergency responders through.',
      smsMessage: 'CRITICAL: Your vehicle is blocking emergency access. Move IMMEDIATELY to allow emergency services through. Lives may depend on it.',
      isDefault: false,
      category: 'blocking',
      severity: 'critical',
    },
    {
      id: 'medical_emergency',
      name: 'Medical Emergency',
      description: 'Medical emergency requiring immediate vehicle access or movement',
      callMessage: 'MEDICAL EMERGENCY: Your vehicle location is needed for a medical emergency response. Please respond immediately or move your vehicle if it is blocking access to emergency services.',
      smsMessage: 'MEDICAL EMERGENCY: Your vehicle is needed for emergency response. Please respond immediately or move if blocking access.',
      isDefault: false,
      category: 'medical',
      severity: 'critical',
    },
    {
      id: 'fire_emergency',
      name: 'Fire Emergency',
      description: 'Fire emergency requiring immediate evacuation or access',
      callMessage: 'FIRE EMERGENCY: Your vehicle may be in danger or blocking fire department access. Please move your vehicle immediately for safety and emergency access.',
      smsMessage: 'FIRE EMERGENCY: Move your vehicle immediately. Fire department needs access or your vehicle may be in danger.',
      isDefault: false,
      category: 'security',
      severity: 'critical',
    },
    {
      id: 'blocking_driveway',
      name: 'Blocking Driveway',
      description: 'Vehicle is blocking someone\'s driveway or private access',
      callMessage: 'Your vehicle is blocking a driveway or private access. The property owner needs to access their property. Please move your vehicle as soon as possible.',
      smsMessage: 'Your vehicle is blocking a driveway. Please move it to allow property access. Thank you.',
      isDefault: false,
      category: 'blocking',
      severity: 'medium',
    },
    {
      id: 'double_parked',
      name: 'Double Parked',
      description: 'Vehicle is double parked and blocking traffic',
      callMessage: 'Your vehicle is double parked and blocking traffic flow. Please move your vehicle immediately to avoid traffic disruption and potential towing.',
      smsMessage: 'Your vehicle is double parked and blocking traffic. Please move immediately to avoid towing.',
      isDefault: false,
      category: 'blocking',
      severity: 'high',
    },
    {
      id: 'handicap_violation',
      name: 'Handicap Parking Violation',
      description: 'Vehicle is illegally parked in handicap space',
      callMessage: 'Your vehicle is parked in a handicap space without proper authorization. This space is reserved for people with disabilities. Please move your vehicle immediately.',
      smsMessage: 'Your vehicle is in a handicap space illegally. Please move immediately. This space is reserved for people with disabilities.',
      isDefault: false,
      category: 'general',
      severity: 'high',
    },
    {
      id: 'security_concern',
      name: 'Security Concern',
      description: 'Vehicle-related security or safety concern',
      callMessage: 'There is a security concern related to your vehicle location. Please check on your vehicle or contact the person trying to reach you about this matter.',
      smsMessage: 'Security concern regarding your vehicle. Please check your vehicle or respond to this alert.',
      isDefault: false,
      category: 'security',
      severity: 'high',
    },
  ];

  constructor() {
    this.retryConfig = {
      maxRetries: parseInt(process.env.ALERT_MAX_RETRIES || '3'),
      retryDelayMs: parseInt(process.env.ALERT_RETRY_DELAY_MS || '2000'),
      maxRetryDelayMs: parseInt(process.env.ALERT_MAX_RETRY_DELAY_MS || '30000'),
      backoffMultiplier: parseFloat(process.env.ALERT_BACKOFF_MULTIPLIER || '2.0'),
    };

    logger.info('AlertService initialized with message templates and retry config', {
      templateCount: this.messageTemplates.length,
      defaultTemplate: this.messageTemplates.find(t => t.isDefault)?.name,
      retryConfig: this.retryConfig,
    });
  }

  /**
   * Send emergency alert with dual-channel approach (call + SMS)
   */
  async sendEmergencyAlert(
    vehicleId: string,
    templateId?: string,
    customMessage?: string,
    customizations?: {
      vehicleInfo?: string;
      location?: string;
      contactInfo?: string;
      urgencyLevel?: string;
    }
  ): Promise<AlertResult> {
    try {
      logger.info('Initiating emergency alert', {
        vehicleId,
        templateId,
        hasCustomMessage: !!customMessage,
      });

      // Get vehicle and owner information
      const vehicle = await vehicleService.getVehicleById(vehicleId);
      if (!vehicle) {
        return {
          alertId: '',
          status: 'failed',
          message: 'Vehicle not found',
        };
      }

      // Get owner phone number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('phone')
        .eq('id', vehicle.userId)
        .single();

      if (userError || !userData) {
        logger.error('Failed to get vehicle owner information', {
          vehicleId,
          error: userError?.message,
        });
        return {
          alertId: '',
          status: 'failed',
          message: 'Failed to get vehicle owner information',
        };
      }

      const ownerPhone = userData.phone;

      // Get message template and customize if needed
      const template = this.getMessageTemplate(templateId);
      let callMessage: string;
      let smsMessage: string;

      if (customMessage) {
        // Use custom message for both call and SMS
        callMessage = customMessage;
        smsMessage = customMessage;
      } else {
        // Use template and apply customizations
        const customizedMessages = this.customizeMessage(template, customizations);
        callMessage = customizedMessages.callMessage;
        smsMessage = customizedMessages.smsMessage;
      }

      // Send emergency call
      const callResult = await this.sendEmergencyCall(vehicleId, ownerPhone, callMessage);
      
      // Send emergency SMS
      const smsResult = await this.sendEmergencySMS(vehicleId, ownerPhone, smsMessage);

      // Determine overall status
      const overallStatus = (callResult.status === 'sent' || smsResult.status === 'sent') 
        ? 'sent' 
        : 'failed';

      const alertId = `alert_${Date.now()}_${vehicleId.slice(-8)}`;

      logger.info('Emergency alert completed', {
        vehicleId,
        alertId,
        overallStatus,
        callStatus: callResult.status,
        smsStatus: smsResult.status,
      });

      return {
        alertId,
        status: overallStatus,
        message: `Emergency alert ${overallStatus}. Call: ${callResult.status}, SMS: ${smsResult.status}`,
      };

    } catch (error: any) {
      logger.error('Failed to send emergency alert', {
        vehicleId,
        error: error.message,
      });

      return {
        alertId: '',
        status: 'failed',
        message: error.message || 'Failed to send emergency alert',
      };
    }
  }

  /**
   * Send emergency call to vehicle owner with retry logic
   */
  private async sendEmergencyCall(
    vehicleId: string,
    ownerPhone: string,
    message: string
  ): Promise<AlertResult> {
    const attempts: AlertAttempt[] = [];
    let delay = this.retryConfig.retryDelayMs;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        logger.info(`Emergency call attempt ${attempt}/${this.retryConfig.maxRetries}`, {
          vehicleId,
          ownerPhone: this.maskPhoneNumber(ownerPhone),
          delay: attempt > 1 ? delay : 0,
        });

        // Add delay for retry attempts
        if (attempt > 1) {
          await this.sleep(delay);
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxRetryDelayMs);
        }

        // Attempt to send emergency call
        const callResult = await callService.initiateMaskedCall(
          ownerPhone, // In emergency, we call the owner directly
          ownerPhone,
          `${process.env.BACKEND_URL}/api/alert/webhook/emergency-call`
        );

        const attemptResult: AlertAttempt = {
          attemptNumber: attempt,
          timestamp: new Date(),
          status: callResult.status === 'initiated' ? 'sent' : 'failed',
          error: callResult.status !== 'initiated' ? callResult.message : undefined,
        };

        attempts.push(attemptResult);

        if (callResult.status === 'initiated') {
          // Success - log and return
          await this.logAlertWithAttempts(vehicleId, 'emergency_call', message, 'sent', attempts);
          
          logger.info(`Emergency call succeeded on attempt ${attempt}`, {
            vehicleId,
            callId: callResult.callId,
          });

          return {
            alertId: callResult.callId,
            status: 'sent',
            message: `Call sent successfully on attempt ${attempt}`,
          };
        }

        logger.warn(`Emergency call attempt ${attempt} failed`, {
          vehicleId,
          error: callResult.message,
        });

      } catch (error: any) {
        const attemptResult: AlertAttempt = {
          attemptNumber: attempt,
          timestamp: new Date(),
          status: 'failed',
          error: error.message,
        };

        attempts.push(attemptResult);

        logger.error(`Emergency call attempt ${attempt} threw exception`, {
          vehicleId,
          error: error.message,
        });
      }
    }

    // All attempts failed - log failure
    await this.logAlertWithAttempts(vehicleId, 'emergency_call', message, 'failed', attempts);

    const lastError = attempts[attempts.length - 1]?.error || 'Unknown error';
    
    logger.error('All emergency call attempts failed', {
      vehicleId,
      totalAttempts: attempts.length,
      lastError,
    });

    return {
      alertId: '',
      status: 'failed',
      message: `All ${this.retryConfig.maxRetries} call attempts failed. Last error: ${lastError}`,
    };
  }

  /**
   * Send emergency SMS to vehicle owner with retry logic
   */
  private async sendEmergencySMS(
    vehicleId: string,
    ownerPhone: string,
    message: string
  ): Promise<AlertResult> {
    const attempts: AlertAttempt[] = [];
    let delay = this.retryConfig.retryDelayMs;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        logger.info(`Emergency SMS attempt ${attempt}/${this.retryConfig.maxRetries}`, {
          vehicleId,
          ownerPhone: this.maskPhoneNumber(ownerPhone),
          messageLength: message.length,
          delay: attempt > 1 ? delay : 0,
        });

        // Add delay for retry attempts
        if (attempt > 1) {
          await this.sleep(delay);
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxRetryDelayMs);
        }

        // Attempt to send emergency SMS
        const smsResult = await callService.sendSMS(
          ownerPhone,
          message,
          `${process.env.BACKEND_URL}/api/alert/webhook/emergency-sms`
        );

        const attemptResult: AlertAttempt = {
          attemptNumber: attempt,
          timestamp: new Date(),
          status: smsResult.status === 'sent' ? 'sent' : 'failed',
          error: smsResult.status !== 'sent' ? smsResult.message : undefined,
        };

        attempts.push(attemptResult);

        if (smsResult.status === 'sent') {
          // Success - log and return
          await this.logAlertWithAttempts(vehicleId, 'emergency_sms', message, 'sent', attempts);
          
          logger.info(`Emergency SMS succeeded on attempt ${attempt}`, {
            vehicleId,
            smsId: smsResult.alertId,
          });

          return {
            alertId: smsResult.alertId,
            status: 'sent',
            message: `SMS sent successfully on attempt ${attempt}`,
          };
        }

        logger.warn(`Emergency SMS attempt ${attempt} failed`, {
          vehicleId,
          error: smsResult.message,
        });

      } catch (error: any) {
        const attemptResult: AlertAttempt = {
          attemptNumber: attempt,
          timestamp: new Date(),
          status: 'failed',
          error: error.message,
        };

        attempts.push(attemptResult);

        logger.error(`Emergency SMS attempt ${attempt} threw exception`, {
          vehicleId,
          error: error.message,
        });
      }
    }

    // All attempts failed - log failure
    await this.logAlertWithAttempts(vehicleId, 'emergency_sms', message, 'failed', attempts);

    const lastError = attempts[attempts.length - 1]?.error || 'Unknown error';
    
    logger.error('All emergency SMS attempts failed', {
      vehicleId,
      totalAttempts: attempts.length,
      lastError,
    });

    return {
      alertId: '',
      status: 'failed',
      message: `All ${this.retryConfig.maxRetries} SMS attempts failed. Last error: ${lastError}`,
    };
  }

  /**
   * Get message template by ID or return default
   */
  private getMessageTemplate(templateId?: string): EmergencyMessageTemplate {
    if (templateId) {
      const template = this.messageTemplates.find(t => t.id === templateId);
      if (template) {
        return template;
      }
    }

    // Return default template
    const defaultTemplate = this.messageTemplates.find(t => t.isDefault);
    if (defaultTemplate) {
      return defaultTemplate;
    }

    // Fallback to first template if no default is found
    if (this.messageTemplates.length > 0) {
      return this.messageTemplates[0]!;
    }

    // This should never happen, but provide a fallback
    throw new Error('No message templates available');
  }

  /**
   * Get all available message templates
   */
  getMessageTemplates(): EmergencyMessageTemplate[] {
    return this.messageTemplates;
  }

  /**
   * Get message templates by category
   */
  getMessageTemplatesByCategory(category: 'general' | 'blocking' | 'medical' | 'security'): EmergencyMessageTemplate[] {
    return this.messageTemplates.filter(template => template.category === category);
  }

  /**
   * Get message templates by severity
   */
  getMessageTemplatesBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): EmergencyMessageTemplate[] {
    return this.messageTemplates.filter(template => template.severity === severity);
  }

  /**
   * Validate custom message content
   */
  validateCustomMessage(message: string): { isValid: boolean; error?: string } {
    if (!message || typeof message !== 'string') {
      return { isValid: false, error: 'Message is required and must be a string' };
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    if (trimmedMessage.length > 500) {
      return { isValid: false, error: 'Message cannot exceed 500 characters' };
    }

    if (trimmedMessage.length < 10) {
      return { isValid: false, error: 'Message must be at least 10 characters long' };
    }

    // Check for potentially harmful content
    const prohibitedPatterns = [
      /\b(hack|hacking|malware|virus)\b/i,
      /\b(scam|fraud|phishing)\b/i,
      /\b(bomb|explosive|weapon)\b/i,
    ];

    for (const pattern of prohibitedPatterns) {
      if (pattern.test(trimmedMessage)) {
        return { isValid: false, error: 'Message contains prohibited content' };
      }
    }

    return { isValid: true };
  }

  /**
   * Customize message template with dynamic content
   */
  customizeMessage(template: EmergencyMessageTemplate, customizations?: {
    vehicleInfo?: string;
    location?: string;
    contactInfo?: string;
    urgencyLevel?: string;
  }): { callMessage: string; smsMessage: string } {
    let callMessage = template.callMessage;
    let smsMessage = template.smsMessage;

    if (customizations) {
      // Add vehicle information if provided
      if (customizations.vehicleInfo) {
        callMessage = callMessage.replace('your vehicle', `your ${customizations.vehicleInfo}`);
        smsMessage = smsMessage.replace('your vehicle', `your ${customizations.vehicleInfo}`);
      }

      // Add location information if provided
      if (customizations.location) {
        callMessage += ` The vehicle is located at ${customizations.location}.`;
        smsMessage += ` Location: ${customizations.location}.`;
      }

      // Add contact information if provided
      if (customizations.contactInfo) {
        callMessage += ` For more information, ${customizations.contactInfo}.`;
        smsMessage += ` Contact: ${customizations.contactInfo}.`;
      }

      // Adjust urgency level if provided
      if (customizations.urgencyLevel) {
        const urgencyPrefixes = {
          low: 'Please note: ',
          medium: 'Important: ',
          high: 'URGENT: ',
          critical: 'CRITICAL EMERGENCY: ',
        };

        const prefix = urgencyPrefixes[customizations.urgencyLevel as keyof typeof urgencyPrefixes] || '';
        if (prefix) {
          callMessage = prefix + callMessage;
          smsMessage = prefix + smsMessage;
        }
      }
    }

    return { callMessage, smsMessage };
  }

  /**
   * Get template statistics and usage info
   */
  getTemplateStats(): {
    totalTemplates: number;
    templatesByCategory: Record<string, number>;
    templatesBySeverity: Record<string, number>;
    defaultTemplate: EmergencyMessageTemplate | null;
  } {
    const templatesByCategory = this.messageTemplates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const templatesBySeverity = this.messageTemplates.reduce((acc, template) => {
      acc[template.severity] = (acc[template.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const defaultTemplate = this.messageTemplates.find(t => t.isDefault) || null;

    return {
      totalTemplates: this.messageTemplates.length,
      templatesByCategory,
      templatesBySeverity,
      defaultTemplate,
    };
  }

  /**
   * Log alert attempt to database with retry information
   */
  private async logAlertWithAttempts(
    vehicleId: string,
    alertType: 'emergency_call' | 'emergency_sms',
    message: string,
    status: 'sent' | 'delivered' | 'failed',
    attempts: AlertAttempt[]
  ): Promise<void> {
    try {
      // Create detailed message with attempt information
      const attemptSummary = attempts.map(attempt => 
        `Attempt ${attempt.attemptNumber}: ${attempt.status}${attempt.error ? ` (${attempt.error})` : ''}`
      ).join('; ');

      const detailedMessage = `${message}\n\nRetry Summary (${attempts.length} attempts): ${attemptSummary}`;

      const { error } = await supabase
        .from('alert_logs')
        .insert({
          vehicle_id: vehicleId,
          alert_type: alertType,
          message: detailedMessage,
          status,
          sent_at: new Date().toISOString(),
        });

      if (error) {
        logger.error('Failed to log alert with attempts', {
          vehicleId,
          alertType,
          status,
          attemptCount: attempts.length,
          error: error.message,
        });
      } else {
        logger.info('Alert logged successfully with retry information', {
          vehicleId,
          alertType,
          status,
          attemptCount: attempts.length,
          finalStatus: status,
        });
      }
    } catch (error: any) {
      logger.error('Exception while logging alert with attempts', {
        vehicleId,
        alertType,
        attemptCount: attempts.length,
        error: error.message,
      });
    }
  }

  /**
   * Log alert attempt to database (legacy method for backward compatibility)
   */
  private async logAlert(
    vehicleId: string,
    alertType: 'emergency_call' | 'emergency_sms',
    message: string,
    status: 'sent' | 'delivered' | 'failed'
  ): Promise<void> {
    const singleAttempt: AlertAttempt = {
      attemptNumber: 1,
      timestamp: new Date(),
      status: status === 'sent' ? 'sent' : 'failed',
    };

    await this.logAlertWithAttempts(vehicleId, alertType, message, status, [singleAttempt]);
  }

  /**
   * Get comprehensive alert logs for a vehicle with retry information
   */
  async getAlertLogs(vehicleId: string, limit?: number): Promise<AlertLog[]> {
    try {
      let query = supabase
        .from('alert_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('sent_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to get alert logs', {
          vehicleId,
          error: error.message,
        });
        return [];
      }

      return data.map(log => ({
        id: log.id,
        vehicleId: log.vehicle_id,
        alertType: log.alert_type,
        message: log.message,
        status: log.status,
        sentAt: new Date(log.sent_at),
        createdAt: new Date(log.created_at),
      }));

    } catch (error: any) {
      logger.error('Exception while getting alert logs', {
        vehicleId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get alert statistics for monitoring and reporting
   */
  async getAlertStats(vehicleId?: string, timeRange?: { start: Date; end: Date }): Promise<{
    totalAlerts: number;
    successfulAlerts: number;
    failedAlerts: number;
    successRate: number;
    alertsByType: Record<string, number>;
    alertsByStatus: Record<string, number>;
    recentAlerts: AlertLog[];
  }> {
    try {
      let query = supabase
        .from('alert_logs')
        .select('*');

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      if (timeRange) {
        query = query
          .gte('sent_at', timeRange.start.toISOString())
          .lte('sent_at', timeRange.end.toISOString());
      }

      const { data, error } = await query.order('sent_at', { ascending: false });

      if (error) {
        logger.error('Failed to get alert stats', {
          vehicleId,
          timeRange,
          error: error.message,
        });
        throw new Error('Failed to get alert statistics');
      }

      const totalAlerts = data.length;
      const successfulAlerts = data.filter(log => log.status === 'sent' || log.status === 'delivered').length;
      const failedAlerts = data.filter(log => log.status === 'failed').length;
      const successRate = totalAlerts > 0 ? (successfulAlerts / totalAlerts) * 100 : 0;

      const alertsByType = data.reduce((acc, log) => {
        acc[log.alert_type] = (acc[log.alert_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const alertsByStatus = data.reduce((acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const recentAlerts = data.slice(0, 10).map(log => ({
        id: log.id,
        vehicleId: log.vehicle_id,
        alertType: log.alert_type,
        message: log.message,
        status: log.status,
        sentAt: new Date(log.sent_at),
        createdAt: new Date(log.created_at),
      }));

      return {
        totalAlerts,
        successfulAlerts,
        failedAlerts,
        successRate: Math.round(successRate * 100) / 100,
        alertsByType,
        alertsByStatus,
        recentAlerts,
      };

    } catch (error: any) {
      logger.error('Exception while getting alert stats', {
        vehicleId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Mask phone number for logging
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.length < 4) {
      return '****';
    }
    return '*'.repeat(phoneNumber.length - 4) + phoneNumber.slice(-4);
  }
}

// Export singleton instance
export const alertService = new AlertService();
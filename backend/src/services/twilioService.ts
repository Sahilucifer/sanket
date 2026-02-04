import axios from 'axios';
import { logger } from '../utils/logger';

export interface TwilioCallRequest {
  from: string;
  to: string;
  url?: string;
  method?: string;
  statusCallback?: string;
  statusCallbackMethod?: string;
  timeout?: number;
}

export interface TwilioCallResponse {
  success: boolean;
  callSid?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface TwilioSMSRequest {
  from: string;
  to: string;
  body: string;
  statusCallback?: string;
}

export interface TwilioSMSResponse {
  success: boolean;
  smsSid?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface TwilioWebhookData {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
  From?: string;
  To?: string;
  Direction?: string;
  StartTime?: string;
  EndTime?: string;
}

export class TwilioService {
  private client: any;
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private baseUrl: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`;

    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      logger.warn('Twilio configuration incomplete. Service may not function properly.');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: this.accountSid,
        password: this.authToken,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config: any) => {
        logger.info('Twilio API Request', {
          method: config.method,
          url: config.url,
          data: config.data ? 'present' : 'none',
        });
        return config;
      },
      (error: any) => {
        logger.error('Twilio API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response: any) => {
        logger.info('Twilio API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: any) => {
        logger.error('Twilio API Response Error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initiate a masked call between caller and vehicle owner using Twilio
   */
  async initiateMaskedCall(
    callerNumber: string,
    ownerNumber: string,
    statusCallback?: string
  ): Promise<TwilioCallResponse> {
    try {
      logger.info('Initiating Twilio masked call', {
        caller: this.maskPhoneNumber(callerNumber),
        owner: this.maskPhoneNumber(ownerNumber),
      });

      // For Twilio, we'll use TwiML to create a conference call for masking
      const twimlUrl = this.generateTwiMLUrl(ownerNumber);

      const callData = new URLSearchParams({
        From: this.phoneNumber,
        To: callerNumber,
        Url: twimlUrl,
        Method: 'POST',
        Timeout: '30',
        ...(statusCallback && { 
          StatusCallback: statusCallback,
          StatusCallbackMethod: 'POST'
        }),
      });

      const response = await this.client.post('/Calls.json', callData);

      if (response.data && response.data.sid) {
        logger.info('Twilio call initiated successfully', {
          callSid: response.data.sid,
          status: response.data.status,
        });

        return {
          success: true,
          callSid: response.data.sid,
          status: response.data.status,
          message: 'Call initiated successfully',
        };
      } else {
        logger.error('Unexpected Twilio response format', { response: response.data });
        return {
          success: false,
          error: 'Unexpected response format from Twilio',
        };
      }
    } catch (error: any) {
      logger.error('Failed to initiate Twilio call', {
        error: error.message,
        response: error.response?.data,
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to initiate call',
      };
    }
  }

  /**
   * Send SMS using Twilio
   */
  async sendSMS(
    toNumber: string,
    message: string,
    statusCallback?: string
  ): Promise<TwilioSMSResponse> {
    try {
      logger.info('Sending Twilio SMS', {
        to: this.maskPhoneNumber(toNumber),
        messageLength: message.length,
      });

      const smsData = new URLSearchParams({
        From: this.phoneNumber,
        To: toNumber,
        Body: message,
        ...(statusCallback && { StatusCallback: statusCallback }),
      });

      const response = await this.client.post('/Messages.json', smsData);

      if (response.data && response.data.sid) {
        logger.info('Twilio SMS sent successfully', {
          smsSid: response.data.sid,
          status: response.data.status,
        });

        return {
          success: true,
          smsSid: response.data.sid,
          status: response.data.status,
          message: 'SMS sent successfully',
        };
      } else {
        logger.error('Unexpected Twilio SMS response format', { response: response.data });
        return {
          success: false,
          error: 'Unexpected response format from Twilio',
        };
      }
    } catch (error: any) {
      logger.error('Failed to send Twilio SMS', {
        error: error.message,
        response: error.response?.data,
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send SMS',
      };
    }
  }

  /**
   * Generate TwiML URL for masked calling
   */
  private generateTwiMLUrl(ownerNumber: string): string {
    // This would typically point to your server's TwiML endpoint
    // For now, we'll use a placeholder that would need to be implemented
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return `${baseUrl}/api/twilio/twiml?to=${encodeURIComponent(ownerNumber)}`;
  }

  /**
   * Generate TwiML for connecting calls
   */
  generateTwiML(ownerNumber: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Connecting you to the vehicle owner. Please wait.</Say>
    <Dial timeout="30" callerId="${this.phoneNumber}">
        <Number>${ownerNumber}</Number>
    </Dial>
    <Say voice="alice">The call could not be completed. Please try again later.</Say>
</Response>`;
  }

  /**
   * Parse webhook data from Twilio
   */
  parseWebhookData(webhookBody: any): TwilioWebhookData | null {
    try {
      // Twilio sends webhook data as form-encoded data
      const data = typeof webhookBody === 'string' ? 
        Object.fromEntries(new URLSearchParams(webhookBody)) : 
        webhookBody;

      logger.info('Parsing Twilio webhook data', {
        callSid: data.CallSid,
        status: data.CallStatus,
      });

      return {
        CallSid: data.CallSid,
        CallStatus: data.CallStatus,
        CallDuration: data.CallDuration,
        From: data.From,
        To: data.To,
        Direction: data.Direction,
        StartTime: data.StartTime,
        EndTime: data.EndTime,
      };
    } catch (error: any) {
      logger.error('Failed to parse Twilio webhook data', {
        error: error.message,
        webhookBody,
      });
      return null;
    }
  }

  /**
   * Validate webhook signature from Twilio
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    url: string
  ): boolean {
    try {
      // Twilio signature validation using crypto
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha1', this.authToken)
        .update(url + payload)
        .digest('base64');

      const isValid = signature === `sha1=${expectedSignature}`;
      
      logger.info('Twilio webhook signature validation', { isValid });
      return isValid;
    } catch (error: any) {
      logger.error('Failed to validate Twilio webhook signature', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Check service health and configuration
   */
  async checkServiceHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
      if (!this.accountSid || !this.authToken || !this.phoneNumber) {
        return {
          healthy: false,
          message: 'Twilio configuration incomplete',
        };
      }

      // Test API connectivity with account info request
      const response = await this.client.get('.json');
      
      if (response.status === 200 && response.data.sid) {
        return {
          healthy: true,
          message: 'Twilio service is healthy',
        };
      } else {
        return {
          healthy: false,
          message: `Twilio API returned unexpected response`,
        };
      }
    } catch (error: any) {
      logger.error('Twilio health check failed', { error: error.message });
      return {
        healthy: false,
        message: error.message || 'Twilio service health check failed',
      };
    }
  }

  /**
   * Get service configuration info (without sensitive data)
   */
  getServiceInfo() {
    return {
      serviceName: 'Twilio',
      configured: !!(this.accountSid && this.authToken && this.phoneNumber),
      phoneNumber: this.phoneNumber ? this.maskPhoneNumber(this.phoneNumber) : null,
      baseUrl: this.baseUrl,
    };
  }

  /**
   * Mask phone number for logging (show only last 4 digits)
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.length < 4) {
      return '****';
    }
    return '*'.repeat(phoneNumber.length - 4) + phoneNumber.slice(-4);
  }
}

// Export singleton instance
export const twilioService = new TwilioService();
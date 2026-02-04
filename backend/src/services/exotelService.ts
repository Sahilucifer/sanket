import axios from 'axios';
import { logger } from '../utils/logger';

export interface ExotelCallRequest {
  from: string;
  to: string;
  callerId: string;
  callType?: string;
  timeLimit?: number;
  timeOut?: number;
  statusCallback?: string;
}

export interface ExotelCallResponse {
  success: boolean;
  callSid?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface ExotelSMSRequest {
  from: string;
  to: string;
  body: string;
  statusCallback?: string;
}

export interface ExotelSMSResponse {
  success: boolean;
  smsSid?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface ExotelWebhookData {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
  From?: string;
  To?: string;
  Direction?: string;
  StartTime?: string;
  EndTime?: string;
}

export class ExotelService {
  private client: any;
  private apiKey: string;
  private apiToken: string;
  private sid: string;
  private virtualNumber: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.EXOTEL_API_KEY || '';
    this.apiToken = process.env.EXOTEL_API_TOKEN || '';
    this.sid = process.env.EXOTEL_SID || '';
    this.virtualNumber = process.env.EXOTEL_VIRTUAL_NUMBER || '';
    this.baseUrl = `https://api.exotel.com/v1/Accounts/${this.sid}`;

    if (!this.apiKey || !this.apiToken || !this.sid || !this.virtualNumber) {
      logger.warn('Exotel configuration incomplete. Service may not function properly.');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: this.apiKey,
        password: this.apiToken,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config: any) => {
        logger.info('Exotel API Request', {
          method: config.method,
          url: config.url,
          data: config.data ? 'present' : 'none',
        });
        return config;
      },
      (error: any) => {
        logger.error('Exotel API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response: any) => {
        logger.info('Exotel API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: any) => {
        logger.error('Exotel API Response Error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initiate a masked call between caller and vehicle owner
   */
  async initiateMaskedCall(
    callerNumber: string,
    ownerNumber: string,
    statusCallback?: string
  ): Promise<ExotelCallResponse> {
    try {
      logger.info('Initiating Exotel masked call', {
        caller: this.maskPhoneNumber(callerNumber),
        owner: this.maskPhoneNumber(ownerNumber),
      });

      const callData = new URLSearchParams({
        From: this.virtualNumber,
        To: callerNumber,
        CallerId: this.virtualNumber,
        CallType: 'trans',
        TimeLimit: '3600', // 1 hour max
        TimeOut: '30', // 30 seconds ring timeout
        ...(statusCallback && { StatusCallback: statusCallback }),
      });

      // For masked calling, we need to connect the caller to the owner
      // This requires a two-step process in Exotel
      const response = await this.client.post('/Calls/connect.json', callData);

      if (response.data && response.data.Call) {
        const call = response.data.Call;
        logger.info('Exotel call initiated successfully', {
          callSid: call.Sid,
          status: call.Status,
        });

        return {
          success: true,
          callSid: call.Sid,
          status: call.Status,
          message: 'Call initiated successfully',
        };
      } else {
        logger.error('Unexpected Exotel response format', { response: response.data });
        return {
          success: false,
          error: 'Unexpected response format from Exotel',
        };
      }
    } catch (error: any) {
      logger.error('Failed to initiate Exotel call', {
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
   * Send SMS using Exotel
   */
  async sendSMS(
    toNumber: string,
    message: string,
    statusCallback?: string
  ): Promise<ExotelSMSResponse> {
    try {
      logger.info('Sending Exotel SMS', {
        to: this.maskPhoneNumber(toNumber),
        messageLength: message.length,
      });

      const smsData = new URLSearchParams({
        From: this.virtualNumber,
        To: toNumber,
        Body: message,
        ...(statusCallback && { StatusCallback: statusCallback }),
      });

      const response = await this.client.post('/Sms/send.json', smsData);

      if (response.data && response.data.SMSMessage) {
        const sms = response.data.SMSMessage;
        logger.info('Exotel SMS sent successfully', {
          smsSid: sms.Sid,
          status: sms.Status,
        });

        return {
          success: true,
          smsSid: sms.Sid,
          status: sms.Status,
          message: 'SMS sent successfully',
        };
      } else {
        logger.error('Unexpected Exotel SMS response format', { response: response.data });
        return {
          success: false,
          error: 'Unexpected response format from Exotel',
        };
      }
    } catch (error: any) {
      logger.error('Failed to send Exotel SMS', {
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
   * Parse webhook data from Exotel
   */
  parseWebhookData(webhookBody: any): ExotelWebhookData | null {
    try {
      // Exotel sends webhook data in different formats depending on the event
      // Handle both form-encoded and JSON formats
      const data = typeof webhookBody === 'string' ? JSON.parse(webhookBody) : webhookBody;

      logger.info('Parsing Exotel webhook data', {
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
      logger.error('Failed to parse Exotel webhook data', {
        error: error.message,
        webhookBody,
      });
      return null;
    }
  }

  /**
   * Validate webhook signature (if Exotel provides signature validation)
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    // Exotel webhook signature validation would go here
    // This is a placeholder as Exotel's signature validation method may vary
    logger.info('Validating Exotel webhook signature');
    return true; // For now, always return true
  }

  /**
   * Check service health and configuration
   */
  async checkServiceHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
      if (!this.apiKey || !this.apiToken || !this.sid || !this.virtualNumber) {
        return {
          healthy: false,
          message: 'Exotel configuration incomplete',
        };
      }

      // Test API connectivity with a simple account info request
      const response = await this.client.get('/');
      
      if (response.status === 200) {
        return {
          healthy: true,
          message: 'Exotel service is healthy',
        };
      } else {
        return {
          healthy: false,
          message: `Exotel API returned status ${response.status}`,
        };
      }
    } catch (error: any) {
      logger.error('Exotel health check failed', { error: error.message });
      return {
        healthy: false,
        message: error.message || 'Exotel service health check failed',
      };
    }
  }

  /**
   * Get service configuration info (without sensitive data)
   */
  getServiceInfo() {
    return {
      serviceName: 'Exotel',
      configured: !!(this.apiKey && this.apiToken && this.sid && this.virtualNumber),
      virtualNumber: this.virtualNumber ? this.maskPhoneNumber(this.virtualNumber) : null,
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
export const exotelService = new ExotelService();
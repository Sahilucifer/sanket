import { exotelService, ExotelCallResponse, ExotelSMSResponse } from './exotelService';
import { twilioService, TwilioCallResponse, TwilioSMSResponse } from './twilioService';
import { logger } from '../utils/logger';
import { CallResult, AlertResult } from '../types';

export type CallProvider = 'exotel' | 'twilio';

export interface CallServiceConfig {
  primaryProvider: CallProvider;
  fallbackProvider?: CallProvider;
  retryAttempts: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
}

export interface UnifiedCallResponse {
  success: boolean;
  callId?: string;
  status?: string;
  message?: string;
  error?: string;
  provider?: CallProvider;
}

export interface UnifiedSMSResponse {
  success: boolean;
  smsId?: string;
  status?: string;
  message?: string;
  error?: string;
  provider?: CallProvider;
}

export class CallService {
  private config: CallServiceConfig;

  constructor(config?: Partial<CallServiceConfig>) {
    this.config = {
      primaryProvider: (process.env.PRIMARY_CALL_PROVIDER as CallProvider) || 'exotel',
      fallbackProvider: (process.env.FALLBACK_CALL_PROVIDER as CallProvider) || 'twilio',
      retryAttempts: parseInt(process.env.CALL_RETRY_ATTEMPTS || '3'),
      retryDelayMs: parseInt(process.env.CALL_RETRY_DELAY_MS || '1000'),
      maxRetryDelayMs: parseInt(process.env.CALL_MAX_RETRY_DELAY_MS || '10000'),
      ...config,
    };

    logger.info('CallService initialized', {
      primaryProvider: this.config.primaryProvider,
      fallbackProvider: this.config.fallbackProvider,
      retryAttempts: this.config.retryAttempts,
    });
  }

  /**
   * Initiate a masked call with automatic provider selection and retry logic
   */
  async initiateMaskedCall(
    callerNumber: string,
    ownerNumber: string,
    statusCallback?: string
  ): Promise<CallResult> {
    logger.info('Initiating masked call with unified service', {
      caller: this.maskPhoneNumber(callerNumber),
      owner: this.maskPhoneNumber(ownerNumber),
      primaryProvider: this.config.primaryProvider,
    });

    // Try primary provider first
    const primaryResult = await this.attemptCallWithRetry(
      this.config.primaryProvider,
      callerNumber,
      ownerNumber,
      statusCallback
    );

    if (primaryResult.success) {
      return {
        callId: primaryResult.callId || '',
        status: 'initiated',
        message: `Call initiated successfully via ${this.config.primaryProvider}`,
      };
    }

    // If primary fails and fallback is configured, try fallback
    if (this.config.fallbackProvider && this.config.fallbackProvider !== this.config.primaryProvider) {
      logger.warn('Primary provider failed, trying fallback', {
        primaryProvider: this.config.primaryProvider,
        fallbackProvider: this.config.fallbackProvider,
        primaryError: primaryResult.error,
      });

      const fallbackResult = await this.attemptCallWithRetry(
        this.config.fallbackProvider,
        callerNumber,
        ownerNumber,
        statusCallback
      );

      if (fallbackResult.success) {
        return {
          callId: fallbackResult.callId || '',
          status: 'initiated',
          message: `Call initiated successfully via ${this.config.fallbackProvider} (fallback)`,
        };
      }

      // Both providers failed
      logger.error('Both call providers failed', {
        primaryError: primaryResult.error,
        fallbackError: fallbackResult.error,
      });

      return {
        callId: '',
        status: 'failed',
        message: `Call failed on both providers: ${primaryResult.error}, ${fallbackResult.error}`,
      };
    }

    // Only primary provider configured and it failed
    return {
      callId: '',
      status: 'failed',
      message: primaryResult.error || 'Call initiation failed',
    };
  }

  /**
   * Send SMS with automatic provider selection and retry logic
   */
  async sendSMS(
    toNumber: string,
    message: string,
    statusCallback?: string
  ): Promise<AlertResult> {
    logger.info('Sending SMS with unified service', {
      to: this.maskPhoneNumber(toNumber),
      messageLength: message.length,
      primaryProvider: this.config.primaryProvider,
    });

    // Try primary provider first
    const primaryResult = await this.attemptSMSWithRetry(
      this.config.primaryProvider,
      toNumber,
      message,
      statusCallback
    );

    if (primaryResult.success) {
      return {
        alertId: primaryResult.smsId || '',
        status: 'sent',
        message: `SMS sent successfully via ${this.config.primaryProvider}`,
      };
    }

    // If primary fails and fallback is configured, try fallback
    if (this.config.fallbackProvider && this.config.fallbackProvider !== this.config.primaryProvider) {
      logger.warn('Primary SMS provider failed, trying fallback', {
        primaryProvider: this.config.primaryProvider,
        fallbackProvider: this.config.fallbackProvider,
        primaryError: primaryResult.error,
      });

      const fallbackResult = await this.attemptSMSWithRetry(
        this.config.fallbackProvider,
        toNumber,
        message,
        statusCallback
      );

      if (fallbackResult.success) {
        return {
          alertId: fallbackResult.smsId || '',
          status: 'sent',
          message: `SMS sent successfully via ${this.config.fallbackProvider} (fallback)`,
        };
      }

      // Both providers failed
      logger.error('Both SMS providers failed', {
        primaryError: primaryResult.error,
        fallbackError: fallbackResult.error,
      });

      return {
        alertId: '',
        status: 'failed',
        message: `SMS failed on both providers: ${primaryResult.error}, ${fallbackResult.error}`,
      };
    }

    // Only primary provider configured and it failed
    return {
      alertId: '',
      status: 'failed',
      message: primaryResult.error || 'SMS sending failed',
    };
  }

  /**
   * Attempt call with exponential backoff retry logic
   */
  private async attemptCallWithRetry(
    provider: CallProvider,
    callerNumber: string,
    ownerNumber: string,
    statusCallback?: string
  ): Promise<UnifiedCallResponse> {
    let lastError = '';
    let delay = this.config.retryDelayMs;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        logger.info(`Call attempt ${attempt}/${this.config.retryAttempts}`, {
          provider,
          delay: attempt > 1 ? delay : 0,
        });

        if (attempt > 1) {
          await this.sleep(delay);
          delay = Math.min(delay * 2, this.config.maxRetryDelayMs); // Exponential backoff
        }

        const result = await this.callProvider(provider, callerNumber, ownerNumber, statusCallback);
        
        if (result.success) {
          logger.info(`Call succeeded on attempt ${attempt}`, { provider });
          return { ...result, provider };
        }

        lastError = result.error || 'Unknown error';
        logger.warn(`Call attempt ${attempt} failed`, { provider, error: lastError });

      } catch (error: any) {
        lastError = error.message || 'Unknown error';
        logger.error(`Call attempt ${attempt} threw exception`, {
          provider,
          error: lastError,
        });
      }
    }

    return {
      success: false,
      error: `All ${this.config.retryAttempts} attempts failed. Last error: ${lastError}`,
      provider,
    };
  }

  /**
   * Attempt SMS with exponential backoff retry logic
   */
  private async attemptSMSWithRetry(
    provider: CallProvider,
    toNumber: string,
    message: string,
    statusCallback?: string
  ): Promise<UnifiedSMSResponse> {
    let lastError = '';
    let delay = this.config.retryDelayMs;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        logger.info(`SMS attempt ${attempt}/${this.config.retryAttempts}`, {
          provider,
          delay: attempt > 1 ? delay : 0,
        });

        if (attempt > 1) {
          await this.sleep(delay);
          delay = Math.min(delay * 2, this.config.maxRetryDelayMs); // Exponential backoff
        }

        const result = await this.smsProvider(provider, toNumber, message, statusCallback);
        
        if (result.success) {
          logger.info(`SMS succeeded on attempt ${attempt}`, { provider });
          return { ...result, provider };
        }

        lastError = result.error || 'Unknown error';
        logger.warn(`SMS attempt ${attempt} failed`, { provider, error: lastError });

      } catch (error: any) {
        lastError = error.message || 'Unknown error';
        logger.error(`SMS attempt ${attempt} threw exception`, {
          provider,
          error: lastError,
        });
      }
    }

    return {
      success: false,
      error: `All ${this.config.retryAttempts} attempts failed. Last error: ${lastError}`,
      provider,
    };
  }

  /**
   * Call specific provider for voice calls
   */
  private async callProvider(
    provider: CallProvider,
    callerNumber: string,
    ownerNumber: string,
    statusCallback?: string
  ): Promise<ExotelCallResponse | TwilioCallResponse> {
    switch (provider) {
      case 'exotel':
        return await exotelService.initiateMaskedCall(callerNumber, ownerNumber, statusCallback);
      case 'twilio':
        return await twilioService.initiateMaskedCall(callerNumber, ownerNumber, statusCallback);
      default:
        throw new Error(`Unknown call provider: ${provider}`);
    }
  }

  /**
   * Call specific provider for SMS
   */
  private async smsProvider(
    provider: CallProvider,
    toNumber: string,
    message: string,
    statusCallback?: string
  ): Promise<ExotelSMSResponse | TwilioSMSResponse> {
    switch (provider) {
      case 'exotel':
        return await exotelService.sendSMS(toNumber, message, statusCallback);
      case 'twilio':
        return await twilioService.sendSMS(toNumber, message, statusCallback);
      default:
        throw new Error(`Unknown SMS provider: ${provider}`);
    }
  }

  /**
   * Parse webhook data from any provider
   */
  parseWebhookData(provider: CallProvider, webhookBody: any) {
    switch (provider) {
      case 'exotel':
        return exotelService.parseWebhookData(webhookBody);
      case 'twilio':
        return twilioService.parseWebhookData(webhookBody);
      default:
        logger.error('Unknown provider for webhook parsing', { provider });
        return null;
    }
  }

  /**
   * Validate webhook signature from any provider
   */
  validateWebhookSignature(
    provider: CallProvider,
    payload: string,
    signature: string,
    url?: string
  ): boolean {
    switch (provider) {
      case 'exotel':
        return exotelService.validateWebhookSignature(payload, signature);
      case 'twilio':
        return twilioService.validateWebhookSignature(payload, signature, url || '');
      default:
        logger.error('Unknown provider for webhook validation', { provider });
        return false;
    }
  }

  /**
   * Check health of all configured providers
   */
  async checkServiceHealth(): Promise<{
    overall: boolean;
    providers: Record<CallProvider, { healthy: boolean; message: string }>;
  }> {
    const results: Record<CallProvider, { healthy: boolean; message: string }> = {} as any;

    // Check primary provider
    if (this.config.primaryProvider === 'exotel') {
      results.exotel = await exotelService.checkServiceHealth();
    } else if (this.config.primaryProvider === 'twilio') {
      results.twilio = await twilioService.checkServiceHealth();
    }

    // Check fallback provider if different
    if (this.config.fallbackProvider && 
        this.config.fallbackProvider !== this.config.primaryProvider) {
      if (this.config.fallbackProvider === 'exotel') {
        results.exotel = await exotelService.checkServiceHealth();
      } else if (this.config.fallbackProvider === 'twilio') {
        results.twilio = await twilioService.checkServiceHealth();
      }
    }

    const overall = Object.values(results).some(result => result.healthy);

    return { overall, providers: results };
  }

  /**
   * Get configuration and status info
   */
  getServiceInfo() {
    return {
      config: {
        primaryProvider: this.config.primaryProvider,
        fallbackProvider: this.config.fallbackProvider,
        retryAttempts: this.config.retryAttempts,
      },
      providers: {
        exotel: exotelService.getServiceInfo(),
        twilio: twilioService.getServiceInfo(),
      },
    };
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
export const callService = new CallService();
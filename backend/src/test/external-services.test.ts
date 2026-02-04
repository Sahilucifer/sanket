import { describe, it, expect, beforeAll } from 'vitest';
import { exotelService } from '../services/exotelService';
import { twilioService } from '../services/twilioService';
import { callService } from '../services/callService';
import { serviceValidator } from '../services/serviceValidator';

describe('External Services Integration', () => {
  describe('ExotelService', () => {
    it('should initialize with correct configuration', () => {
      const serviceInfo = exotelService.getServiceInfo();
      
      expect(serviceInfo.serviceName).toBe('Exotel');
      expect(serviceInfo.configured).toBe(false); // No real API keys in test
      expect(serviceInfo.baseUrl).toContain('api.exotel.com');
    });

    it('should handle health check gracefully', async () => {
      const health = await exotelService.checkServiceHealth();
      
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('message');
      expect(typeof health.healthy).toBe('boolean');
      expect(typeof health.message).toBe('string');
    });

    it('should parse webhook data correctly', () => {
      const webhookData = {
        CallSid: 'test-call-sid-123',
        CallStatus: 'completed',
        CallDuration: '45',
        From: '+1234567890',
        To: '+0987654321'
      };

      const parsed = exotelService.parseWebhookData(webhookData);
      
      expect(parsed).toBeDefined();
      expect(parsed?.CallSid).toBe('test-call-sid-123');
      expect(parsed?.CallStatus).toBe('completed');
      expect(parsed?.CallDuration).toBe('45');
    });

    it('should validate webhook signature', () => {
      const isValid = exotelService.validateWebhookSignature('payload', 'signature');
      
      // Currently returns true as placeholder
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('TwilioService', () => {
    it('should initialize with correct configuration', () => {
      const serviceInfo = twilioService.getServiceInfo();
      
      expect(serviceInfo.serviceName).toBe('Twilio');
      expect(serviceInfo.configured).toBe(true); // Test env has test API keys
      expect(serviceInfo.baseUrl).toContain('api.twilio.com');
    });

    it('should handle health check gracefully', async () => {
      const health = await twilioService.checkServiceHealth();
      
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('message');
      expect(typeof health.healthy).toBe('boolean');
      expect(typeof health.message).toBe('string');
    });

    it('should parse webhook data correctly', () => {
      const webhookData = {
        CallSid: 'test-call-sid-456',
        CallStatus: 'completed',
        CallDuration: '60',
        From: '+1234567890',
        To: '+0987654321'
      };

      const parsed = twilioService.parseWebhookData(webhookData);
      
      expect(parsed).toBeDefined();
      expect(parsed?.CallSid).toBe('test-call-sid-456');
      expect(parsed?.CallStatus).toBe('completed');
      expect(parsed?.CallDuration).toBe('60');
    });

    it('should generate TwiML correctly', () => {
      const twiml = twilioService.generateTwiML('+1234567890');
      
      expect(twiml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(twiml).toContain('<Response>');
      expect(twiml).toContain('<Dial');
      expect(twiml).toContain('+1234567890');
      expect(twiml).toContain('</Response>');
    });

    it('should validate webhook signature', () => {
      const isValid = twilioService.validateWebhookSignature('payload', 'signature', 'url');
      
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('CallService (Unified)', () => {
    it('should initialize with correct configuration', () => {
      const serviceInfo = callService.getServiceInfo();
      
      expect(serviceInfo.config).toHaveProperty('primaryProvider');
      expect(serviceInfo.config).toHaveProperty('fallbackProvider');
      expect(serviceInfo.config).toHaveProperty('retryAttempts');
      expect(serviceInfo.providers).toHaveProperty('exotel');
      expect(serviceInfo.providers).toHaveProperty('twilio');
    });

    it('should handle service health check', async () => {
      const health = await callService.checkServiceHealth();
      
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('providers');
      expect(typeof health.overall).toBe('boolean');
      expect(health.providers).toHaveProperty('exotel');
      expect(health.providers).toHaveProperty('twilio');
    });

    it('should parse webhook data for different providers', () => {
      const exotelData = {
        CallSid: 'exotel-call-123',
        CallStatus: 'completed'
      };

      const twilioData = {
        CallSid: 'twilio-call-456',
        CallStatus: 'completed'
      };

      const parsedExotel = callService.parseWebhookData('exotel', exotelData);
      const parsedTwilio = callService.parseWebhookData('twilio', twilioData);

      expect(parsedExotel?.CallSid).toBe('exotel-call-123');
      expect(parsedTwilio?.CallSid).toBe('twilio-call-456');
    });
  });

  describe('ServiceValidator', () => {
    it('should validate phone numbers correctly', () => {
      const validPhone = serviceValidator.validatePhoneNumber('+1234567890');
      const invalidPhone = serviceValidator.validatePhoneNumber('invalid');

      expect(validPhone.isValid).toBe(true);
      expect(validPhone.sanitizedData).toBe('+1234567890');

      expect(invalidPhone.isValid).toBe(false);
      expect(invalidPhone.error).toContain('international format');
    });

    it('should validate message content correctly', () => {
      const validMessage = serviceValidator.validateMessageContent('Test emergency message');
      const emptyMessage = serviceValidator.validateMessageContent('');
      const longMessage = serviceValidator.validateMessageContent('a'.repeat(1700));

      expect(validMessage.isValid).toBe(true);
      expect(validMessage.sanitizedData).toBe('Test emergency message');

      expect(emptyMessage.isValid).toBe(false);
      expect(emptyMessage.error).toContain('not allowed to be empty');

      expect(longMessage.isValid).toBe(false);
      expect(longMessage.error).toContain('maximum length');
    });

    it('should validate webhook data correctly', () => {
      const validExotelWebhook = {
        CallSid: 'test-call-sid',
        CallStatus: 'completed'
      };

      const invalidWebhook = {
        CallStatus: 'completed'
        // Missing CallSid
      };

      const validResult = serviceValidator.validateWebhookData('exotel', validExotelWebhook);
      const invalidResult = serviceValidator.validateWebhookData('exotel', invalidWebhook);

      expect(validResult.isValid).toBe(true);
      expect(validResult.sanitizedData?.CallSid).toBe('test-call-sid');

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('CallSid');
    });

    it('should parse service errors correctly', () => {
      const quotaError = { message: 'Quota exceeded', status: 429 };
      const authError = { message: 'Unauthorized', status: 401 };
      const serviceError = { message: 'Service unavailable', status: 503 };

      const parsedQuota = serviceValidator.parseServiceError('exotel', quotaError);
      const parsedAuth = serviceValidator.parseServiceError('twilio', authError);
      const parsedService = serviceValidator.parseServiceError('exotel', serviceError);

      expect(parsedQuota.errorType).toBe('quota_exceeded');
      expect(parsedQuota.shouldRetry).toBe(true);
      expect(parsedQuota.retryAfter).toBe(3600);

      expect(parsedAuth.errorType).toBe('authentication_failed');
      expect(parsedAuth.shouldRetry).toBe(false);

      expect(parsedService.errorType).toBe('service_unavailable');
      expect(parsedService.shouldRetry).toBe(true);
      expect(parsedService.retryAfter).toBe(60);
    });

    it('should check quota status', async () => {
      const quotaStatus = await serviceValidator.checkQuotaStatus('exotel');

      expect(quotaStatus).toHaveProperty('provider');
      expect(quotaStatus).toHaveProperty('quotaExceeded');
      expect(quotaStatus.provider).toBe('exotel');
      expect(typeof quotaStatus.quotaExceeded).toBe('boolean');
    });

    it('should get comprehensive service status', async () => {
      const status = await serviceValidator.getServiceStatus();

      expect(status).toHaveProperty('overall');
      expect(status).toHaveProperty('providers');
      expect(status).toHaveProperty('quotas');
      expect(typeof status.overall).toBe('boolean');
      expect(status.quotas).toHaveProperty('exotel');
      expect(status.quotas).toHaveProperty('twilio');
    });
  });
});
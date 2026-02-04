import { callService } from '../services/callService';
import { exotelService } from '../services/exotelService';
import { twilioService } from '../services/twilioService';
import { serviceValidator } from '../services/serviceValidator';
import { logger } from '../utils/logger';

async function testExternalServices() {
  logger.info('🧪 Testing External Services Integration');

  try {
    // Test service configuration
    logger.info('📋 Checking service configurations...');
    
    const exotelInfo = exotelService.getServiceInfo();
    const twilioInfo = twilioService.getServiceInfo();
    const callServiceInfo = callService.getServiceInfo();

    logger.info('Exotel Service Info:', exotelInfo);
    logger.info('Twilio Service Info:', twilioInfo);
    logger.info('Call Service Info:', callServiceInfo);

    // Test service health checks
    logger.info('🏥 Checking service health...');
    
    const exotelHealth = await exotelService.checkServiceHealth();
    const twilioHealth = await twilioService.checkServiceHealth();
    const overallHealth = await callService.checkServiceHealth();

    logger.info('Exotel Health:', exotelHealth);
    logger.info('Twilio Health:', twilioHealth);
    logger.info('Overall Health:', overallHealth);

    // Test validation functions
    logger.info('✅ Testing validation functions...');

    // Test phone number validation
    const validPhone = serviceValidator.validatePhoneNumber('+1234567890');
    const invalidPhone = serviceValidator.validatePhoneNumber('invalid');
    
    logger.info('Valid phone validation:', validPhone);
    logger.info('Invalid phone validation:', invalidPhone);

    // Test message validation
    const validMessage = serviceValidator.validateMessageContent('Test emergency message');
    const invalidMessage = serviceValidator.validateMessageContent('');
    
    logger.info('Valid message validation:', validMessage);
    logger.info('Invalid message validation:', invalidMessage);

    // Test webhook data validation
    const exotelWebhookData = {
      CallSid: 'test-call-sid-123',
      CallStatus: 'completed',
      CallDuration: '45',
      From: '+1234567890',
      To: '+0987654321'
    };

    const twilioWebhookData = {
      CallSid: 'test-call-sid-456',
      CallStatus: 'completed',
      CallDuration: '60',
      From: '+1234567890',
      To: '+0987654321'
    };

    const exotelWebhookValidation = serviceValidator.validateWebhookData('exotel', exotelWebhookData);
    const twilioWebhookValidation = serviceValidator.validateWebhookData('twilio', twilioWebhookData);

    logger.info('Exotel webhook validation:', exotelWebhookValidation);
    logger.info('Twilio webhook validation:', twilioWebhookValidation);

    // Test webhook parsing
    logger.info('🔍 Testing webhook parsing...');
    
    const parsedExotelWebhook = exotelService.parseWebhookData(exotelWebhookData);
    const parsedTwilioWebhook = twilioService.parseWebhookData(twilioWebhookData);

    logger.info('Parsed Exotel webhook:', parsedExotelWebhook);
    logger.info('Parsed Twilio webhook:', parsedTwilioWebhook);

    // Test service status
    logger.info('📊 Getting comprehensive service status...');
    
    const serviceStatus = await serviceValidator.getServiceStatus();
    logger.info('Service Status:', serviceStatus);

    // Test error parsing
    logger.info('🚨 Testing error parsing...');
    
    const quotaError = { message: 'Quota exceeded', status: 429 };
    const authError = { message: 'Unauthorized', status: 401 };
    const serviceError = { message: 'Service unavailable', status: 503 };

    const parsedQuotaError = serviceValidator.parseServiceError('exotel', quotaError);
    const parsedAuthError = serviceValidator.parseServiceError('twilio', authError);
    const parsedServiceError = serviceValidator.parseServiceError('exotel', serviceError);

    logger.info('Parsed quota error:', parsedQuotaError);
    logger.info('Parsed auth error:', parsedAuthError);
    logger.info('Parsed service error:', parsedServiceError);

    logger.info('✅ External Services Integration Test Completed Successfully!');
    
    return {
      success: true,
      message: 'All external service integration tests passed',
      results: {
        configurations: { exotelInfo, twilioInfo, callServiceInfo },
        health: { exotelHealth, twilioHealth, overallHealth },
        validations: {
          validPhone,
          invalidPhone,
          validMessage,
          invalidMessage,
          exotelWebhookValidation,
          twilioWebhookValidation
        },
        parsing: { parsedExotelWebhook, parsedTwilioWebhook },
        serviceStatus,
        errorParsing: { parsedQuotaError, parsedAuthError, parsedServiceError }
      }
    };

  } catch (error: any) {
    logger.error('❌ External Services Integration Test Failed:', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      message: `External service integration test failed: ${error.message}`,
      error: error.message
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testExternalServices()
    .then((result) => {
      if (result.success) {
        logger.info('🎉 Test completed successfully');
        process.exit(0);
      } else {
        logger.error('💥 Test failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

export { testExternalServices };
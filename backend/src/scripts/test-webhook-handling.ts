import dotenv from 'dotenv';
import { callService } from '../services/callService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testWebhookHandling() {
  try {
    console.log('🧪 Testing Webhook Handling System...\n');

    // Test 1: Parse Exotel webhook data
    console.log('1. Testing Exotel webhook parsing...');
    const exotelWebhookData = {
      CallSid: 'test-call-sid-123',
      CallStatus: 'completed',
      CallDuration: '45',
      From: '+1234567890',
      To: '+0987654321',
      Direction: 'outbound-api',
      StartTime: new Date().toISOString(),
      EndTime: new Date().toISOString()
    };

    const parsedExotelData = callService.parseWebhookData('exotel', exotelWebhookData);
    console.log('Parsed Exotel Data:', JSON.stringify(parsedExotelData, null, 2));

    // Test 2: Parse Twilio webhook data
    console.log('\n2. Testing Twilio webhook parsing...');
    const twilioWebhookData = {
      CallSid: 'test-twilio-call-sid-456',
      CallStatus: 'completed',
      CallDuration: '60',
      From: '+1234567890',
      To: '+0987654321',
      Direction: 'outbound-api',
      StartTime: new Date().toISOString(),
      EndTime: new Date().toISOString()
    };

    const parsedTwilioData = callService.parseWebhookData('twilio', twilioWebhookData);
    console.log('Parsed Twilio Data:', JSON.stringify(parsedTwilioData, null, 2));

    // Test 3: Test webhook signature validation
    console.log('\n3. Testing webhook signature validation...');
    
    // Test Exotel signature validation (placeholder)
    const exotelSignatureValid = callService.validateWebhookSignature(
      'exotel',
      JSON.stringify(exotelWebhookData),
      'test-signature'
    );
    console.log('Exotel Signature Valid:', exotelSignatureValid);

    // Test Twilio signature validation
    const twilioSignatureValid = callService.validateWebhookSignature(
      'twilio',
      JSON.stringify(twilioWebhookData),
      'test-signature',
      'https://example.com/webhook'
    );
    console.log('Twilio Signature Valid:', twilioSignatureValid);

    // Test 4: Test invalid webhook data
    console.log('\n4. Testing invalid webhook data handling...');
    const invalidData = callService.parseWebhookData('exotel', 'invalid-json');
    console.log('Invalid Data Result:', invalidData);

    // Test 5: Test unknown provider
    console.log('\n5. Testing unknown provider handling...');
    try {
      const unknownProviderData = callService.parseWebhookData('unknown' as any, {});
      console.log('Unknown Provider Result:', unknownProviderData);
    } catch (error: any) {
      console.log('Expected error for unknown provider:', error.message);
    }

    console.log('\n✅ Webhook handling system test completed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testWebhookHandling();
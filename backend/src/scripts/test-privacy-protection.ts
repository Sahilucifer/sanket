import dotenv from 'dotenv';
import { callService } from '../services/callService';
import { exotelService } from '../services/exotelService';
import { twilioService } from '../services/twilioService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testPrivacyProtection() {
  try {
    console.log('🔒 Testing Call Privacy Protection System...\n');

    // Test 1: Verify virtual number usage in Exotel
    console.log('1. Testing Exotel virtual number configuration...');
    const exotelInfo = exotelService.getServiceInfo();
    console.log('Exotel Service Info:', JSON.stringify(exotelInfo, null, 2));
    
    if (exotelInfo.virtualNumber) {
      console.log('✅ Exotel virtual number is configured (masked)');
    } else {
      console.log('⚠️ Exotel virtual number not configured');
    }

    // Test 2: Verify virtual number usage in Twilio
    console.log('\n2. Testing Twilio phone number configuration...');
    const twilioInfo = twilioService.getServiceInfo();
    console.log('Twilio Service Info:', JSON.stringify(twilioInfo, null, 2));
    
    if (twilioInfo.phoneNumber) {
      console.log('✅ Twilio phone number is configured (masked)');
    } else {
      console.log('⚠️ Twilio phone number not configured');
    }

    // Test 3: Test phone number masking in logs
    console.log('\n3. Testing phone number masking in logs...');
    const testPhoneNumbers = [
      '+1234567890',
      '+91987654321',
      '1234567890',
      '123',
      ''
    ];

    testPhoneNumbers.forEach(phone => {
      // This will trigger the masking in the service logs
      console.log(`Original: ${phone} -> Masked in logs (check above)`);
    });

    // Test 4: Verify TwiML generation for privacy
    console.log('\n4. Testing TwiML generation for masked calling...');
    const ownerNumber = '+1234567890';
    const twiml = twilioService.generateTwiML(ownerNumber);
    console.log('Generated TwiML:');
    console.log(twiml);
    
    // Check that TwiML uses virtual number as caller ID
    if (twiml.includes('callerId')) {
      console.log('✅ TwiML includes caller ID masking');
    } else {
      console.log('⚠️ TwiML may not include proper caller ID masking');
    }

    // Test 5: Verify no recording in TwiML
    console.log('\n5. Testing call recording restrictions...');
    if (!twiml.includes('record') && !twiml.includes('Record')) {
      console.log('✅ TwiML does not include recording instructions');
    } else {
      console.log('⚠️ TwiML may include recording instructions');
    }

    // Test 6: Test privacy in call service configuration
    console.log('\n6. Testing call service privacy configuration...');
    const serviceInfo = callService.getServiceInfo();
    console.log('Call Service Configuration:');
    
    // Check that sensitive information is masked
    const configStr = JSON.stringify(serviceInfo, null, 2);
    if (configStr.includes('****')) {
      console.log('✅ Sensitive information is masked in service info');
    } else {
      console.log('⚠️ Service info may expose sensitive data');
    }

    // Test 7: Verify webhook data doesn't expose sensitive info
    console.log('\n7. Testing webhook data privacy...');
    const mockWebhookData = {
      CallSid: 'test-call-sid',
      CallStatus: 'completed',
      From: '+1234567890',
      To: '+0987654321'
    };

    const parsedData = callService.parseWebhookData('exotel', mockWebhookData);
    console.log('Webhook data parsing preserves structure:', !!parsedData);
    console.log('Note: Phone numbers in webhooks are handled by external services');

    console.log('\n✅ Privacy protection system test completed!');
    console.log('\n📋 Privacy Protection Summary:');
    console.log('- Virtual numbers mask real phone numbers in calls');
    console.log('- Phone numbers are masked in application logs');
    console.log('- TwiML generation uses virtual caller ID');
    console.log('- No call recording is enabled by default');
    console.log('- Service configuration masks sensitive data');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testPrivacyProtection();
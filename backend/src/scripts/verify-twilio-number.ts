import dotenv from 'dotenv';
import { TwilioService } from '../services/twilioService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function verifyTwilioNumber() {
  console.log('🔍 Checking environment variables...');
  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET');
  console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET');
  console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'SET' : 'NOT SET');
  
  console.log('\n🔍 Checking Twilio service configuration...');
  
  // Create a fresh instance after loading env vars
  const twilioService = new TwilioService();
  
  const serviceInfo = twilioService.getServiceInfo();
  console.log('Service Info:', serviceInfo);
  
  const healthCheck = await twilioService.checkServiceHealth();
  console.log('Health Check:', healthCheck);
  
  if (!healthCheck.healthy) {
    console.error('❌ Twilio service is not healthy. Please check your configuration.');
    return;
  }
  
  console.log('\n📋 To verify a phone number in Twilio trial account:');
  console.log('1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
  console.log('2. Click "Add a new number"');
  console.log('3. Enter the phone number: +919903125198');
  console.log('4. Follow the verification process (SMS or call)');
  console.log('5. Once verified, the number can receive calls from your Twilio trial account');
  
  console.log('\n💡 Alternative: Upgrade to a paid Twilio account to call any number');
}

verifyTwilioNumber().catch(console.error);
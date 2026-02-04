import dotenv from 'dotenv';
import { TwilioService } from '../services/twilioService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testTwilioCredentials() {
  console.log('Testing Twilio credentials...');
  
  const twilioService = new TwilioService();
  
  try {
    // Test health check
    console.log('Testing Twilio service health...');
    const healthCheck = await twilioService.checkServiceHealth();
    console.log('Health check result:', healthCheck);
    
    if (healthCheck.healthy) {
      console.log('✅ Twilio service is healthy!');
      
      // Test SMS sending to a test number (you can replace with your number)
      console.log('Testing SMS sending...');
      const testPhone = '+1234567890'; // Replace with your test number
      const testMessage = 'Test message from Masked Calling System';
      
      const smsResult = await twilioService.sendSMS(testPhone, testMessage);
      console.log('SMS result:', smsResult);
      
      if (smsResult.success) {
        console.log('✅ SMS sent successfully!');
      } else {
        console.log('❌ SMS failed:', smsResult.error);
      }
    } else {
      console.log('❌ Twilio service is not healthy:', healthCheck.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing Twilio:', error);
  }
}

// Run the test
testTwilioCredentials().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
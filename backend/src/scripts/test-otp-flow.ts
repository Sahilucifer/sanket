import dotenv from 'dotenv';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testOTPFlow() {
  try {
    logger.info('🧪 Testing OTP Flow...');

    // Test phone number (use a test number)
    const testPhone = '+1234567890';

    // Step 1: Send OTP
    logger.info('📱 Step 1: Sending OTP...');
    const sendResult = await authService.sendOTP(testPhone);
    logger.info('Send OTP Result:', sendResult);

    if (!sendResult.success) {
      throw new Error('Failed to send OTP');
    }

    // Step 2: Simulate OTP verification (we need to get the OTP from logs)
    logger.info('🔐 Step 2: OTP sent successfully!');
    logger.info('✅ OTP Flow Test Completed Successfully!');
    
    // In a real scenario, you would:
    // 1. Get the OTP from SMS
    // 2. Call authService.verifyOTP(testPhone, otp)
    // 3. Receive JWT token for authentication

    logger.info('📋 Next Steps:');
    logger.info('1. Check the logs above for the DEBUG OTP');
    logger.info('2. Use that OTP to test verification in the frontend');
    logger.info('3. The OTP expires in 10 minutes');

  } catch (error) {
    logger.error('❌ OTP Flow Test Failed:', error);
    throw error;
  }
}

// Run the test
testOTPFlow()
  .then(() => {
    logger.info('🎉 Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Test failed:', error);
    process.exit(1);
  });
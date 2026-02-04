import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { authService } from '../services/authService';
import { logger } from '../utils/logger';

async function testAuthService() {
  logger.info('Testing Authentication Service...');
  
  try {
    // Test 1: Register a test user
    logger.info('Test 1: User Registration');
    const testPhone = '+1234567890';
    const testName = 'Test User';
    
    const registerResult = await authService.register({
      name: testName,
      phoneNumber: testPhone
    });
    
    logger.info('✅ Registration successful:', registerResult);
    
    // Test 2: Generate and validate token
    logger.info('Test 2: Token Generation');
    const testUserId = 'test-user-id';
    const token = authService.generateToken(testUserId);
    logger.info('✅ Token generated successfully');
    
    // Test 3: Validate token
    logger.info('Test 3: Token Validation');
    const validation = await authService.validateToken(token);
    logger.info('✅ Token validation result:', validation);
    
    logger.info('✅ Authentication Service tests completed successfully');
    
  } catch (error) {
    logger.error('❌ Authentication Service test failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await testAuthService();
    logger.info('🎉 All authentication tests passed!');
  } catch (error) {
    logger.error('💥 Authentication tests failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
import dotenv from 'dotenv';
import { callService } from '../services/callService';
import { vehicleService } from '../services/vehicleService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testCallInitiation() {
  try {
    console.log('🧪 Testing Call Initiation System...\n');

    // Test 1: Check call service configuration
    console.log('1. Testing call service configuration...');
    const serviceInfo = callService.getServiceInfo();
    console.log('Service Info:', JSON.stringify(serviceInfo, null, 2));

    // Test 2: Check service health
    console.log('\n2. Testing service health...');
    const healthCheck = await callService.checkServiceHealth();
    console.log('Health Check:', JSON.stringify(healthCheck, null, 2));

    // Test 3: Test vehicle service integration
    console.log('\n3. Testing vehicle service integration...');
    const vehicleConfig = vehicleService.validateConfiguration();
    console.log('Vehicle Service Config Valid:', vehicleConfig);

    // Test 4: Test masked call initiation (mock)
    console.log('\n4. Testing masked call initiation (mock)...');
    const mockCallerNumber = '+1234567890';
    const mockOwnerNumber = '+0987654321';
    
    try {
      const callResult = await callService.initiateMaskedCall(
        mockCallerNumber,
        mockOwnerNumber,
        'http://localhost:3001/api/call/webhook/exotel'
      );
      console.log('Call Result:', JSON.stringify(callResult, null, 2));
    } catch (error: any) {
      console.log('Expected error (no real API keys):', error.message);
    }

    console.log('\n✅ Call initiation system test completed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testCallInitiation();
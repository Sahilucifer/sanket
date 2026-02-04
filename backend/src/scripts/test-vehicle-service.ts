import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { VehicleService } from '../services/vehicleService';
import { logger } from '../utils/logger';

async function testVehicleService() {
  logger.info('Testing Vehicle Service...');
  
  const vehicleService = new VehicleService();
  
  try {
    // Test 1: Configuration validation
    logger.info('Test 1: Configuration Validation');
    const isConfigValid = vehicleService.validateConfiguration();
    logger.info('✅ Configuration validation result:', isConfigValid);
    
    // Test 2: Get vehicles for non-existent user (should return empty array)
    logger.info('Test 2: Get Vehicles for Non-existent User');
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format
    const vehicles = await vehicleService.getVehiclesByUser(testUserId);
    logger.info('✅ Vehicles retrieved:', vehicles.length);
    
    // Test 3: Get vehicle by non-existent ID (should return null)
    logger.info('Test 3: Get Non-existent Vehicle');
    const nonExistentVehicle = await vehicleService.getVehicleById('550e8400-e29b-41d4-a716-446655440001');
    logger.info('✅ Non-existent vehicle result:', nonExistentVehicle);
    
    // Test 4: Get vehicle for scan with non-existent ID
    logger.info('Test 4: Get Vehicle for Scan (Non-existent)');
    const scanResult = await vehicleService.getVehicleForScan('550e8400-e29b-41d4-a716-446655440002');
    logger.info('✅ Scan result for non-existent vehicle:', scanResult);
    
    logger.info('✅ Vehicle Service tests completed successfully');
    
  } catch (error) {
    logger.error('❌ Vehicle Service test failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await testVehicleService();
    logger.info('🎉 All vehicle service tests passed!');
  } catch (error) {
    logger.error('💥 Vehicle service tests failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
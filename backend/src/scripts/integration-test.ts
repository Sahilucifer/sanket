import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { authService } from '../services/authService';
import { VehicleService } from '../services/vehicleService';
import { logger } from '../utils/logger';

async function runIntegrationTest() {
  logger.info('🚀 Starting Integration Test...');
  
  const vehicleService = new VehicleService();
  
  try {
    // Step 1: Register a test user
    logger.info('Step 1: User Registration');
    const testPhone = `+1${Date.now().toString().slice(-10)}`; // Unique phone number
    const testName = 'Integration Test User';
    
    const registerResult = await authService.register({
      name: testName,
      phoneNumber: testPhone
    });
    
    logger.info('✅ Registration successful:', registerResult);
    
    // Step 2: Simulate OTP verification (we'll use the OTP from logs)
    // In a real scenario, you'd get this from SMS
    logger.info('Step 2: OTP Verification (simulated)');
    // For testing, we'll skip actual OTP verification and create user directly
    
    // Step 3: Create a test vehicle
    logger.info('Step 3: Vehicle Creation');
    // First, let's create a user directly in the database for testing
    const { data: testUser, error: userError } = await (await import('../config/database')).supabase
      .from('users')
      .insert({
        name: testName,
        phone: testPhone,
        is_verified: true
      })
      .select('*')
      .single();
    
    if (userError) {
      logger.error('Failed to create test user:', userError);
      throw new Error('Failed to create test user');
    }
    
    logger.info('✅ Test user created:', testUser.id);
    
    // Now create a vehicle
    const testCarNumber = `TEST${Date.now().toString().slice(-4)}`;
    const vehicle = await vehicleService.createVehicle(testUser.id, testCarNumber);
    
    logger.info('✅ Vehicle created successfully:', {
      id: vehicle.id,
      carNumber: vehicle.carNumber,
      qrUrl: vehicle.qrUrl ? 'Generated' : 'Failed'
    });
    
    // Step 4: Test vehicle retrieval
    logger.info('Step 4: Vehicle Retrieval');
    const userVehicles = await vehicleService.getVehiclesByUser(testUser.id);
    logger.info('✅ User vehicles retrieved:', userVehicles.length);
    
    const vehicleById = await vehicleService.getVehicleById(vehicle.id);
    logger.info('✅ Vehicle by ID retrieved:', vehicleById?.carNumber);
    
    // Step 5: Test scan functionality
    logger.info('Step 5: Scan Functionality');
    const scanData = await vehicleService.getVehicleForScan(vehicle.id);
    logger.info('✅ Scan data retrieved:', scanData);
    
    // Step 6: Test owner phone retrieval (internal use)
    logger.info('Step 6: Owner Phone Retrieval');
    const ownerPhone = await vehicleService.getVehicleOwnerPhone(vehicle.id);
    logger.info('✅ Owner phone retrieved (masked):', ownerPhone ? 'Found' : 'Not found');
    
    // Step 7: Test vehicle update
    logger.info('Step 7: Vehicle Update');
    const updatedVehicle = await vehicleService.updateVehicle(vehicle.id, {
      carNumber: testCarNumber + '-UPD'
    });
    logger.info('✅ Vehicle updated:', updatedVehicle.carNumber);
    
    // Step 8: Clean up - delete test vehicle
    logger.info('Step 8: Cleanup');
    await vehicleService.deleteVehicle(vehicle.id);
    logger.info('✅ Vehicle deleted (soft delete)');
    
    // Clean up test user
    const { error: deleteError } = await (await import('../config/database')).supabase
      .from('users')
      .delete()
      .eq('id', testUser.id);
    
    if (deleteError) {
      logger.warn('Failed to delete test user:', deleteError);
    } else {
      logger.info('✅ Test user deleted');
    }
    
    logger.info('🎉 Integration test completed successfully!');
    
  } catch (error) {
    logger.error('💥 Integration test failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await runIntegrationTest();
    logger.info('✅ All integration tests passed!');
  } catch (error) {
    logger.error('❌ Integration tests failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
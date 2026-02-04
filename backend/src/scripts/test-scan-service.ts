import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { scanService } from '../services/scanService';
import { supabase } from '../config/database';
import { logger } from '../utils/logger';

async function testScanService() {
  try {
    logger.info('🧪 Testing Scan Service...');

    // Test 1: Try to get a non-existent vehicle
    logger.info('Test 1: Getting non-existent vehicle...');
    const nonExistentVehicle = await scanService.getVehicleForScan('00000000-0000-0000-0000-000000000000');
    if (nonExistentVehicle === null) {
      logger.info('✅ Test 1 PASSED: Non-existent vehicle returns null');
    } else {
      logger.error('❌ Test 1 FAILED: Non-existent vehicle should return null');
      return false;
    }

    // Test 2: Create a test vehicle and try to get it
    logger.info('Test 2: Creating test vehicle and retrieving it...');
    
    // First create a test user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        name: 'Test Scan User',
        phone: '+1234567899',
        is_verified: true
      })
      .select()
      .single();

    if (userError) {
      logger.error('❌ Failed to create test user:', userError);
      return false;
    }

    // Create a test vehicle
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        user_id: userData.id,
        car_number: 'SCAN123',
        is_active: true
      })
      .select()
      .single();

    if (vehicleError) {
      logger.error('❌ Failed to create test vehicle:', vehicleError);
      return false;
    }

    const testVehicleId = vehicleData.id;

    // Now try to get the vehicle for scanning
    const vehicle = await scanService.getVehicleForScan(testVehicleId);
    if (vehicle && vehicle.carNumber === 'SCAN123' && vehicle.userId === '' && vehicle.qrUrl === null) {
      logger.info('✅ Test 2 PASSED: Vehicle retrieved with privacy protection');
    } else {
      logger.error('❌ Test 2 FAILED: Vehicle not retrieved correctly or privacy not protected');
      return false;
    }

    // Test 3: Log a scan event
    logger.info('Test 3: Logging scan event...');
    const scanLog = await scanService.logScan(
      testVehicleId,
      '192.168.1.100',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    if (scanLog && scanLog.vehicleId === testVehicleId && scanLog.ipAddress === '192.168.1.100') {
      logger.info('✅ Test 3 PASSED: Scan event logged successfully');
    } else {
      logger.error('❌ Test 3 FAILED: Scan event not logged correctly');
      return false;
    }

    // Test 4: Get scan logs
    logger.info('Test 4: Retrieving scan logs...');
    const logs = await scanService.getScanLogs(testVehicleId, 10);
    if (logs && logs.length > 0 && logs[0]?.vehicleId === testVehicleId) {
      logger.info('✅ Test 4 PASSED: Scan logs retrieved successfully');
    } else {
      logger.error('❌ Test 4 FAILED: Scan logs not retrieved correctly');
      return false;
    }

    // Test 5: Get scan statistics
    logger.info('Test 5: Getting scan statistics...');
    const stats = await scanService.getVehicleScanStats(testVehicleId);
    if (stats && stats.vehicleId === testVehicleId && stats.totalScans >= 1) {
      logger.info('✅ Test 5 PASSED: Scan statistics retrieved successfully');
      logger.info(`   Total scans: ${stats.totalScans}`);
      logger.info(`   Unique IPs: ${stats.uniqueIPs}`);
    } else {
      logger.error('❌ Test 5 FAILED: Scan statistics not retrieved correctly');
      return false;
    }

    // Test 6: Get filtered scan logs with analytics
    logger.info('Test 6: Getting filtered scan logs with analytics...');
    const filteredResult = await scanService.getScanLogsWithFilters(
      testVehicleId,
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      new Date(),
      undefined,
      10,
      0
    );

    if (filteredResult && filteredResult.logs.length > 0 && filteredResult.analytics) {
      logger.info('✅ Test 6 PASSED: Filtered scan logs with analytics retrieved successfully');
      logger.info(`   Total scans in analytics: ${filteredResult.analytics.totalScans}`);
      logger.info(`   Unique IPs in analytics: ${filteredResult.analytics.uniqueIPs}`);
    } else {
      logger.error('❌ Test 6 FAILED: Filtered scan logs with analytics not retrieved correctly');
      return false;
    }

    // Clean up test data
    logger.info('🧹 Cleaning up test data...');
    await supabase.from('vehicles').delete().eq('id', testVehicleId);
    await supabase.from('users').delete().eq('id', userData.id);

    logger.info('🎉 All scan service tests PASSED!');
    return true;

  } catch (error) {
    logger.error('❌ Scan service test failed:', error);
    return false;
  }
}

// Run the test
testScanService()
  .then((success) => {
    if (success) {
      logger.info('🏆 SCAN SERVICE TEST STATUS: PASSED');
      process.exit(0);
    } else {
      logger.error('💥 SCAN SERVICE TEST STATUS: FAILED');
      process.exit(1);
    }
  })
  .catch((error) => {
    logger.error('💥 SCAN SERVICE TEST ERROR:', error);
    process.exit(1);
  });
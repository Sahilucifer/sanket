#!/usr/bin/env ts-node

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { logService } from '../services/logService';
import { logger } from '../utils/logger';

async function testLogService() {
  try {
    logger.info('Testing log service functionality...');

    // Test call log creation
    logger.info('Testing call log creation...');
    const testVehicleId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
    const callLog = await logService.createCallLog({
      vehicleId: testVehicleId,
      callerNumber: '+1234567890',
      ownerNumber: '+0987654321',
      status: 'initiated',
      callSid: 'test-call-sid',
    });
    logger.info('✅ Call log created successfully', { id: callLog.id });

    // Test alert log creation
    logger.info('Testing alert log creation...');
    const alertLog = await logService.createAlertLog({
      vehicleId: testVehicleId,
      alertType: 'emergency_sms',
      message: 'Test emergency message',
      status: 'sent',
    });
    logger.info('✅ Alert log created successfully', { id: alertLog.id });

    // Test scan log creation
    logger.info('Testing scan log creation...');
    const scanLog = await logService.createScanLog({
      vehicleId: testVehicleId,
      ipAddress: '192.168.1.1',
      userAgent: 'Test User Agent',
    });
    logger.info('✅ Scan log created successfully', { id: scanLog.id });

    // Test querying logs
    logger.info('Testing log querying...');
    const callLogs = await logService.queryCallLogs({
      vehicleId: testVehicleId,
      limit: 10,
    });
    logger.info('✅ Call logs queried successfully', { count: callLogs.data.length });

    const alertLogs = await logService.queryAlertLogs({
      vehicleId: testVehicleId,
      limit: 10,
    });
    logger.info('✅ Alert logs queried successfully', { count: alertLogs.data.length });

    const scanLogs = await logService.queryScanLogs({
      vehicleId: testVehicleId,
      limit: 10,
    });
    logger.info('✅ Scan logs queried successfully', { count: scanLogs.data.length });

    // Test comprehensive vehicle logs
    logger.info('Testing comprehensive vehicle logs...');
    const vehicleLogs = await logService.getVehicleLogs(testVehicleId);
    logger.info('✅ Vehicle logs retrieved successfully', {
      callLogs: vehicleLogs.callLogs.total,
      alertLogs: vehicleLogs.alertLogs.total,
      scanLogs: vehicleLogs.scanLogs.total,
    });

    logger.info('🎉 All log service tests passed successfully!');

  } catch (error: any) {
    logger.error('❌ Log service test failed', { error: error.message });
    throw error;
  }
}

// Run test if called directly
if (require.main === module) {
  testLogService()
    .then(() => {
      logger.info('Log service test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Log service test failed', { error: error.message });
      process.exit(1);
    });
}

export { testLogService };
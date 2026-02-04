import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import request from 'supertest';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import app from '../index';
import { logger } from '../utils/logger';

async function testScanEndpoints() {
  try {
    logger.info('🧪 Testing Scan Endpoints...');

    // Test 1: Test invalid vehicle ID format
    logger.info('Test 1: Testing invalid vehicle ID format...');
    const response1 = await request(app)
      .get('/api/scan/invalid-id')
      .expect(400);

    if (response1.body.error?.code === 'INVALID_VEHICLE_ID_FORMAT') {
      logger.info('✅ Test 1 PASSED: Invalid vehicle ID format handled correctly');
    } else {
      logger.error('❌ Test 1 FAILED: Invalid vehicle ID format not handled correctly');
      return false;
    }

    // Test 2: Test non-existent vehicle ID
    logger.info('Test 2: Testing non-existent vehicle ID...');
    const response2 = await request(app)
      .get('/api/scan/00000000-0000-0000-0000-000000000000')
      .expect(404);

    if (response2.body.error?.code === 'VEHICLE_NOT_FOUND') {
      logger.info('✅ Test 2 PASSED: Non-existent vehicle ID handled correctly');
    } else {
      logger.error('❌ Test 2 FAILED: Non-existent vehicle ID not handled correctly');
      return false;
    }

    // Test 3: Test scan logs endpoint without authentication
    logger.info('Test 3: Testing scan logs endpoint without authentication...');
    const response3 = await request(app)
      .get('/api/scan/logs/00000000-0000-0000-0000-000000000000')
      .expect(401);

    if (response3.body.error?.message.includes('token') || response3.body.error?.message.includes('auth')) {
      logger.info('✅ Test 3 PASSED: Scan logs endpoint requires authentication');
    } else {
      logger.error('❌ Test 3 FAILED: Scan logs endpoint should require authentication');
      return false;
    }

    logger.info('🎉 All scan endpoint tests PASSED!');
    return true;

  } catch (error) {
    logger.error('❌ Scan endpoint test failed:', error);
    return false;
  }
}

// Run the test
testScanEndpoints()
  .then((success) => {
    if (success) {
      logger.info('🏆 SCAN ENDPOINT TEST STATUS: PASSED');
      process.exit(0);
    } else {
      logger.error('💥 SCAN ENDPOINT TEST STATUS: FAILED');
      process.exit(1);
    }
  })
  .catch((error) => {
    logger.error('💥 SCAN ENDPOINT TEST ERROR:', error);
    process.exit(1);
  });
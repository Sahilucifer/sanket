#!/usr/bin/env node

/**
 * Simple test script to verify QR code URL generation
 */

import dotenv from 'dotenv';
import { QRCodeService } from '../services/qrCodeService';

// Load environment variables
dotenv.config();

function testQRSimple() {
  try {
    console.log('🔧 Testing QR Code URL Generation...\n');

    // Create QR service
    const qrService = new QRCodeService();

    // Test configuration
    console.log('⚙️  Testing configuration...');
    const isConfigValid = qrService.validateConfiguration();
    console.log(`Configuration valid: ${isConfigValid ? '✅' : '❌'}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);

    if (!isConfigValid) {
      console.log('❌ Configuration is invalid. Please check FRONTEND_URL environment variable.');
      return;
    }

    // Test scan URL generation
    const testVehicleId = 'test-vehicle-123';
    console.log(`\n🔗 Testing scan URL generation for vehicle: ${testVehicleId}`);
    const scanUrl = qrService.getScanUrl(testVehicleId);
    console.log(`Scan URL: ${scanUrl}`);

    console.log('\n✅ QR code URL generation test completed!');
  } catch (error) {
    console.log('❌ QR code URL generation test failed:', error);
  }
}

// Run the test
testQRSimple();
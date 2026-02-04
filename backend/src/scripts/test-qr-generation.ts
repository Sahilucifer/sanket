#!/usr/bin/env node

/**
 * Test script to verify QR code generation functionality
 */

import dotenv from 'dotenv';
import { QRCodeService } from '../services/qrCodeService';
import { initializeStorage } from '../config/storage';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testQRGeneration() {
  try {
    console.log('🔧 Testing QR Code Generation...\n');

    // Initialize storage
    console.log('📦 Initializing storage...');
    await initializeStorage();

    // Create QR service
    const qrService = new QRCodeService();

    // Test configuration
    console.log('⚙️  Testing configuration...');
    const isConfigValid = qrService.validateConfiguration();
    console.log(`Configuration valid: ${isConfigValid ? '✅' : '❌'}`);

    if (!isConfigValid) {
      console.log('❌ Configuration is invalid. Please check FRONTEND_URL environment variable.');
      process.exit(1);
    }

    // Test scan URL generation
    const testVehicleId = 'test-vehicle-' + Date.now();
    console.log(`\n🔗 Testing scan URL generation for vehicle: ${testVehicleId}`);
    const scanUrl = qrService.getScanUrl(testVehicleId);
    console.log(`Scan URL: ${scanUrl}`);

    // Test QR code generation
    console.log('\n📱 Testing QR code generation...');
    const qrUrl = await qrService.generateQRCode(testVehicleId);
    
    if (qrUrl) {
      console.log('✅ QR code generated successfully!');
      console.log(`QR URL: ${qrUrl}`);
      
      // Test QR code deletion
      console.log('\n🗑️  Testing QR code deletion...');
      const deleted = await qrService.deleteQRCode(testVehicleId);
      console.log(`QR code deleted: ${deleted ? '✅' : '❌'}`);
    } else {
      console.log('❌ QR code generation failed');
    }

    console.log('\n✅ QR code generation test completed!');
  } catch (error) {
    logger.error('Error testing QR generation:', error);
    console.log('❌ QR code generation test failed:', error);
    process.exit(1);
  }
}

// Run the test
testQRGeneration();
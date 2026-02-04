#!/usr/bin/env node

/**
 * Direct test for QR code functionality without environment dependencies
 */

import QRCode from 'qrcode';

async function testQRDirect() {
  try {
    console.log('🔧 Testing QR Code Generation Directly...\n');

    // Test QR code generation with a sample URL
    const testVehicleId = 'test-vehicle-123';
    const frontendUrl = 'http://localhost:3000';
    const scanUrl = `${frontendUrl}/scan/${testVehicleId}`;

    console.log(`🔗 Scan URL: ${scanUrl}`);

    // Generate QR code as buffer
    console.log('📱 Generating QR code...');
    const qrCodeBuffer = await QRCode.toBuffer(scanUrl, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
    });

    console.log(`✅ QR code generated successfully!`);
    console.log(`Buffer size: ${qrCodeBuffer.length} bytes`);

    // Test QR code as data URL
    console.log('\n📱 Generating QR code as data URL...');
    const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
    });

    console.log(`✅ QR code data URL generated successfully!`);
    console.log(`Data URL length: ${qrCodeDataUrl.length} characters`);
    console.log(`Data URL preview: ${qrCodeDataUrl.substring(0, 100)}...`);

    console.log('\n✅ QR code direct test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- QR code library is working correctly');
    console.log('- Buffer generation works');
    console.log('- Data URL generation works');
    console.log('- The issue is likely with storage upload or environment configuration');

  } catch (error) {
    console.log('❌ QR code direct test failed:', error);
  }
}

// Run the test
testQRDirect();
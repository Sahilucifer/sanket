import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Manually set FRONTEND_URL to match server config
process.env.FRONTEND_URL = 'http://192.168.1.19:3000';

import { QRCodeService } from '../services/qrCodeService';
import { vehicleService } from '../services/vehicleService';
import { logger } from '../utils/logger';

async function debugQRIssue() {
  try {
    console.log('🔍 Debugging QR Code Issue...');

    const vehicleId = '1e56b7b4-916a-45c2-94d0-8f4d49c129f9';
    const qrCodeService = new QRCodeService();

    console.log('📋 Step 1: Check QR Code Service Configuration');
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('QR Service validation:', qrCodeService.validateConfiguration());
    console.log('Expected scan URL:', qrCodeService.getScanUrl(vehicleId));

    console.log('\n📋 Step 2: Get Current Vehicle Data');
    try {
      const vehicle = await vehicleService.getVehicleById(vehicleId);
      if (vehicle) {
        console.log('Vehicle found:', {
          id: vehicle.id,
          carNumber: vehicle.carNumber,
          qrUrl: vehicle.qrUrl,
          isActive: vehicle.isActive
        });
      } else {
        console.log('❌ Vehicle not found');
        return;
      }
    } catch (error) {
      console.error('❌ Error getting vehicle:', error);
      return;
    }

    console.log('\n📋 Step 3: Test QR Code Generation');
    try {
      const newQrUrl = await qrCodeService.generateQRCode(vehicleId);
      
      if (newQrUrl) {
        console.log('✅ QR Code generated successfully!');
        console.log('New QR URL:', newQrUrl);
        
        // Test if the URL is accessible
        console.log('\n📋 Step 4: Test QR URL Accessibility');
        try {
          const response = await fetch(newQrUrl);
          console.log('QR URL response status:', response.status);
          console.log('QR URL response headers:', Object.fromEntries(response.headers.entries()));
        } catch (fetchError) {
          console.error('❌ QR URL not accessible:', fetchError);
        }
        
        // Update vehicle with new QR URL
        console.log('\n📋 Step 5: Update Vehicle with New QR URL');
        try {
          const updatedVehicle = await vehicleService.getVehicleById(vehicleId);
          console.log('Updated vehicle QR URL:', updatedVehicle?.qrUrl);
        } catch (updateError) {
          console.error('❌ Error getting updated vehicle:', updateError);
        }
        
      } else {
        console.error('❌ QR Code generation failed');
      }
    } catch (genError) {
      console.error('❌ QR Code generation error:', genError);
    }

    console.log('\n✅ Debug Complete!');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug
debugQRIssue();
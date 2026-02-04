#!/usr/bin/env node

/**
 * Integration test for QR code functionality
 */

import dotenv from 'dotenv';
import { VehicleService } from '../services/vehicleService';
import { logger } from '../utils/logger';
import { testConnection } from '../config/database';
import { initializeStorage } from '../config/storage';

// Load environment variables
dotenv.config();

async function testQRIntegration() {
  try {
    console.log('🔧 Testing QR Code Integration...\n');

    // Test database connection
    console.log('📊 Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('❌ Database connection failed');
      return;
    }
    console.log('✅ Database connected');

    // Initialize storage
    console.log('📦 Initializing storage...');
    await initializeStorage();
    console.log('✅ Storage initialized');

    // Create services
    const vehicleService = new VehicleService();

    // Test configuration
    console.log('⚙️  Testing vehicle service configuration...');
    const isConfigValid = vehicleService.validateConfiguration();
    console.log(`Configuration valid: ${isConfigValid ? '✅' : '❌'}`);

    if (!isConfigValid) {
      console.log('❌ Configuration is invalid. Please check FRONTEND_URL environment variable.');
      return;
    }

    // For testing purposes, we'll use a mock user ID
    // In a real scenario, you would get this from authentication
    console.log('\n👤 Using mock user ID for testing...');
    const userId = '00000000-0000-0000-0000-000000000000'; // Mock UUID
    console.log(`✅ Mock user ID: ${userId}`);

    // Create a test vehicle
    console.log('\n🚗 Creating test vehicle...');
    const testCarNumber = 'QR-TEST-' + Date.now();
    
    try {
      const vehicle = await vehicleService.createVehicle(userId, testCarNumber);
      console.log(`✅ Vehicle created: ${vehicle.id}`);
      console.log(`QR URL: ${vehicle.qrUrl || 'NOT GENERATED'}`);

      if (vehicle.qrUrl) {
        console.log('✅ QR code generated successfully!');
        
        // Test QR code regeneration
        console.log('\n🔄 Testing QR code regeneration...');
        const newQrUrl = await vehicleService.regenerateQRCode(vehicle.id);
        
        if (newQrUrl) {
          console.log('✅ QR code regenerated successfully!');
          console.log(`New QR URL: ${newQrUrl}`);
        } else {
          console.log('❌ QR code regeneration failed');
        }
      } else {
        console.log('❌ QR code generation failed');
      }

      // Clean up test vehicle
      console.log('\n🗑️  Cleaning up test vehicle...');
      await vehicleService.deleteVehicle(vehicle.id);
      console.log('✅ Test vehicle deleted');

    } catch (error: any) {
      console.log('❌ Vehicle creation failed:', error.message);
    }

    console.log('\n✅ QR code integration test completed!');
  } catch (error) {
    logger.error('Error in QR integration test:', error);
    console.log('❌ QR code integration test failed:', error);
  }
}

// Run the test
testQRIntegration();
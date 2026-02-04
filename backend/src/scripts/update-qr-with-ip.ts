import dotenv from 'dotenv';
import path from 'path';
import { QRCodeService } from '../services/qrCodeService';
import { vehicleService } from '../services/vehicleService';
import { logger } from '../utils/logger';

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Debug environment variables
console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

async function updateQRWithIP() {
  try {
    logger.info('🔄 Updating QR Code with IP Address...');

    const qrCodeService = new QRCodeService();

    // Test with the existing vehicle
    const existingVehicleId = 'ceadfabd-aeba-4953-928b-8438c75b78dd';
    
    logger.info('📋 Step 1: Getting Current Vehicle Data');
    const vehicle = await vehicleService.getVehicleById(existingVehicleId);
    
    if (vehicle) {
      logger.info('🚗 Current Vehicle Details:', {
        id: vehicle.id,
        carNumber: vehicle.carNumber,
        currentQrUrl: vehicle.qrUrl,
        isActive: vehicle.isActive
      });
      
      logger.info('📋 Step 2: Regenerating QR Code with IP Address');
      const newQrUrl = await qrCodeService.regenerateQRCode(existingVehicleId);
      
      if (newQrUrl) {
        logger.info('✅ QR Code regenerated successfully!');
        logger.info(`🔗 New QR URL: ${newQrUrl}`);
        
        // Get updated vehicle data
        const updatedVehicle = await vehicleService.getVehicleById(existingVehicleId);
        if (updatedVehicle) {
          const scanUrl = qrCodeService.getScanUrl(existingVehicleId);
          logger.info('');
          logger.info('🎯 TESTING INSTRUCTIONS:');
          logger.info('');
          logger.info('📱 Phone Testing (Real QR Scan):');
          logger.info('   1. Make sure your phone is on the same WiFi network');
          logger.info(`   2. Open QR image: ${newQrUrl}`);
          logger.info('   3. Scan with phone camera or QR scanner app');
          logger.info(`   4. Should redirect to: ${scanUrl}`);
          logger.info('');
          logger.info('💻 Computer Testing (Direct URL):');
          logger.info(`   1. Open: ${scanUrl}`);
          logger.info(`   2. Should show scan page for vehicle: ${updatedVehicle.carNumber}`);
          logger.info('');
          logger.info('🔧 Server Setup:');
          logger.info('   1. Start backend: npm run dev (in backend folder)');
          logger.info('   2. Start frontend: npm run dev (in frontend folder)');
          logger.info('   3. Frontend should be accessible at: http://192.168.1.19:3000');
          logger.info('   4. Backend should be accessible at: http://192.168.1.19:3001');
          logger.info('');
        }
      } else {
        logger.error('❌ Failed to regenerate QR code');
      }
    } else {
      logger.error('❌ Vehicle not found');
    }

    logger.info('✅ QR Update Complete!');

  } catch (error) {
    logger.error('❌ QR Update Failed:', error);
    throw error;
  }
}

// Run the update
updateQRWithIP()
  .then(() => {
    logger.info('🎉 Update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Update failed:', error);
    process.exit(1);
  });
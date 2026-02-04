import dotenv from 'dotenv';
import { vehicleService } from '../services/vehicleService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testQRDisplay() {
  try {
    logger.info('🧪 Testing QR Code Display Issue...');

    // Create a test user ID (in real scenario, this would come from auth)
    const testUserId = 'test-user-123';
    const testCarNumber = 'TEST-QR-001';

    logger.info('🚗 Step 1: Creating test vehicle...');
    
    try {
      // Create a test vehicle
      const vehicle = await vehicleService.createVehicle(testUserId, testCarNumber);
      logger.info('Vehicle created:', {
        id: vehicle.id,
        carNumber: vehicle.carNumber,
        qrUrl: vehicle.qrUrl,
        isActive: vehicle.isActive
      });

      if (!vehicle.qrUrl) {
        logger.warn('⚠️  QR URL is null - this is the issue!');
        
        // Try to regenerate QR code
        logger.info('🔄 Attempting to regenerate QR code...');
        const newQrUrl = await vehicleService.regenerateQRCode(vehicle.id);
        
        if (newQrUrl) {
          logger.info('✅ QR code regenerated successfully:', newQrUrl);
          
          // Fetch the vehicle again to see updated data
          const updatedVehicle = await vehicleService.getVehicleById(vehicle.id);
          logger.info('Updated vehicle data:', {
            id: updatedVehicle?.id,
            carNumber: updatedVehicle?.carNumber,
            qrUrl: updatedVehicle?.qrUrl,
            isActive: updatedVehicle?.isActive
          });
        } else {
          logger.error('❌ Failed to regenerate QR code');
        }
      } else {
        logger.info('✅ QR URL is present:', vehicle.qrUrl);
      }

      // Clean up - delete the test vehicle
      logger.info('🧹 Cleaning up test vehicle...');
      await vehicleService.deleteVehicle(vehicle.id);
      logger.info('✅ Test vehicle cleaned up');

    } catch (createError) {
      logger.error('Error in vehicle operations:', createError);
    }

    logger.info('✅ QR Display Test Completed!');

  } catch (error) {
    logger.error('❌ QR Display Test Failed:', error);
    throw error;
  }
}

// Run the test
testQRDisplay()
  .then(() => {
    logger.info('🎉 Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Test failed:', error);
    process.exit(1);
  });
import dotenv from 'dotenv';
import { QRCodeService } from '../services/qrCodeService';
import { vehicleService } from '../services/vehicleService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testCompleteQRFlow() {
  try {
    logger.info('🧪 Testing Complete QR Code Flow...');

    const qrCodeService = new QRCodeService();

    // Test with the existing vehicle we fixed
    const existingVehicleId = 'ceadfabd-aeba-4953-928b-8438c75b78dd';
    
    logger.info('📋 Step 1: Testing QR Code URL Generation');
    const scanUrl = qrCodeService.getScanUrl(existingVehicleId);
    logger.info(`🔗 Scan URL: ${scanUrl}`);
    
    logger.info('📋 Step 2: Getting Vehicle Data');
    const vehicle = await vehicleService.getVehicleById(existingVehicleId);
    
    if (vehicle) {
      logger.info('🚗 Vehicle Details:', {
        id: vehicle.id,
        carNumber: vehicle.carNumber,
        qrUrl: vehicle.qrUrl,
        isActive: vehicle.isActive
      });
      
      if (vehicle.qrUrl) {
        logger.info('📋 Step 3: QR Code Testing Instructions');
        logger.info('');
        logger.info('🎯 HOW TO TEST THE QR CODE:');
        logger.info('');
        logger.info('Method 1 - Direct URL Test:');
        logger.info(`   Open this URL in your browser: ${scanUrl}`);
        logger.info('');
        logger.info('Method 2 - QR Code Image Test:');
        logger.info(`   1. Open QR image: ${vehicle.qrUrl}`);
        logger.info('   2. Scan with phone camera or QR scanner app');
        logger.info('   3. Should redirect to scan page');
        logger.info('');
        logger.info('Method 3 - Frontend Test:');
        logger.info('   1. Go to: http://localhost:3000/login');
        logger.info('   2. Login with phone number');
        logger.info('   3. Go to dashboard and view vehicle');
        logger.info('   4. Download/view QR code');
        logger.info('   5. Test scanning');
        logger.info('');
        logger.info('📱 EXPECTED BEHAVIOR:');
        logger.info(`   ✅ QR code should redirect to: ${scanUrl}`);
        logger.info(`   ✅ Scan page should show vehicle: ${vehicle.carNumber}`);
        logger.info('   ✅ User can enter their phone number');
        logger.info('   ✅ System initiates masked call between phones');
        logger.info('');
        
        // Test the scan endpoint
        logger.info('📋 Step 4: Testing Scan Endpoint');
        const scanData = await vehicleService.getVehicleForScan(existingVehicleId);
        
        if (scanData) {
          logger.info('✅ Scan endpoint working:', {
            carNumber: scanData.carNumber,
            isActive: scanData.isActive
          });
        } else {
          logger.error('❌ Scan endpoint failed - vehicle not found or inactive');
        }
        
      } else {
        logger.error('❌ Vehicle has no QR URL - QR code generation failed');
      }
    } else {
      logger.error('❌ Vehicle not found');
    }

    logger.info('');
    logger.info('🔧 TROUBLESHOOTING:');
    logger.info('   - Make sure both servers are running:');
    logger.info('     Backend: http://localhost:3001');
    logger.info('     Frontend: http://localhost:3000');
    logger.info('   - Check browser console for errors');
    logger.info('   - Verify QR image loads correctly');
    logger.info('');

    logger.info('✅ Complete QR Flow Test Finished!');

  } catch (error) {
    logger.error('❌ QR Flow Test Failed:', error);
    throw error;
  }
}

// Run the test
testCompleteQRFlow()
  .then(() => {
    logger.info('🎉 Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Test failed:', error);
    process.exit(1);
  });
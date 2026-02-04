import dotenv from 'dotenv';
import axios from 'axios';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testScanPage() {
  try {
    logger.info('🧪 Testing Scan Page Functionality...');

    const vehicleId = 'ceadfabd-aeba-4953-928b-8438c75b78dd';
    const backendUrl = 'http://localhost:3001';
    const frontendUrl = 'http://localhost:3000';

    // Test 1: Backend scan endpoint
    logger.info('📋 Step 1: Testing Backend Scan Endpoint');
    try {
      const response = await axios.get(`${backendUrl}/api/scan/${vehicleId}`);
      logger.info('✅ Backend scan endpoint working:', {
        success: (response.data as any).success,
        vehicleId: (response.data as any).data.vehicleId,
        carNumber: (response.data as any).data.carNumber
      });
    } catch (error: any) {
      logger.error('❌ Backend scan endpoint failed:', error.message);
    }

    // Test 2: Frontend scan page (just check if it responds)
    logger.info('📋 Step 2: Testing Frontend Scan Page');
    try {
      const response = await axios.get(`${frontendUrl}/scan/${vehicleId}`, {
        timeout: 5000,
        validateStatus: () => true // Accept any status code
      });
      
      if (response.status === 200) {
        logger.info('✅ Frontend scan page accessible');
      } else {
        logger.warn(`⚠️  Frontend scan page returned status: ${response.status}`);
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        logger.warn('⚠️  Frontend server not running on port 3000');
      } else {
        logger.error('❌ Frontend scan page test failed:', error.message);
      }
    }

    // Test 3: QR Image accessibility
    logger.info('📋 Step 3: Testing QR Image Accessibility');
    const qrImageUrl = 'https://rehzyfkjamdnnutvvrlr.supabase.co/storage/v1/object/public/qr-codes/qr-codes/ceadfabd-aeba-4953-928b-8438c75b78dd.png';
    
    try {
      const response = await axios.head(qrImageUrl, { timeout: 5000 });
      if (response.status === 200) {
        logger.info('✅ QR image is accessible');
        logger.info(`   Content-Type: ${response.headers['content-type']}`);
        logger.info(`   Content-Length: ${response.headers['content-length']} bytes`);
      }
    } catch (error: any) {
      logger.error('❌ QR image not accessible:', error.message);
    }

    logger.info('');
    logger.info('🎯 MANUAL TESTING INSTRUCTIONS:');
    logger.info('');
    logger.info('1. 📱 Test QR Code Scanning:');
    logger.info(`   - Open: ${qrImageUrl}`);
    logger.info('   - Scan with phone camera');
    logger.info(`   - Should redirect to: ${frontendUrl}/scan/${vehicleId}`);
    logger.info('');
    logger.info('2. 🌐 Test Direct URL:');
    logger.info(`   - Open: ${frontendUrl}/scan/${vehicleId}`);
    logger.info('   - Should show vehicle: UP80CV890');
    logger.info('   - Should have "Call Owner" and "Emergency Alert" options');
    logger.info('');
    logger.info('3. 📞 Test Call Functionality:');
    logger.info('   - Click "Start Call"');
    logger.info('   - Enter your phone number');
    logger.info('   - Click "Initiate Call"');
    logger.info('   - Should receive a call from the system');
    logger.info('');
    logger.info('4. 🚨 Test Emergency Alert:');
    logger.info('   - Click "Send Emergency Alert"');
    logger.info('   - Confirm the action');
    logger.info('   - Vehicle owner should receive SMS and call');
    logger.info('');

    logger.info('✅ Scan Page Test Completed!');

  } catch (error) {
    logger.error('❌ Scan Page Test Failed:', error);
    throw error;
  }
}

// Run the test
testScanPage()
  .then(() => {
    logger.info('🎉 Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Test failed:', error);
    process.exit(1);
  });
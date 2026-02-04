import axios from 'axios';

async function testScanUrl() {
  try {
    console.log('🧪 Testing Scan URL...');

    const vehicleId = 'ceadfabd-aeba-4953-928b-8438c75b78dd';
    const scanApiUrl = `http://localhost:3001/api/scan/${vehicleId}`;
    const frontendScanUrl = `http://192.168.1.19:3000/scan/${vehicleId}`;

    console.log('📋 Step 1: Testing Backend Scan API');
    console.log(`API URL: ${scanApiUrl}`);
    
    const response = await axios.get(scanApiUrl);
    
    if (response.data.success) {
      console.log('✅ Backend scan API working!');
      console.log('Vehicle data:', {
        carNumber: response.data.data.carNumber,
        isActive: response.data.data.isActive
      });
      
      console.log('');
      console.log('📋 Step 2: Frontend URLs');
      console.log(`Frontend Scan URL: ${frontendScanUrl}`);
      console.log('');
      console.log('🎯 TESTING INSTRUCTIONS:');
      console.log('');
      console.log('💻 Computer Testing:');
      console.log(`   1. Open: ${frontendScanUrl}`);
      console.log('   2. Should show scan page with vehicle info');
      console.log('   3. Try entering a phone number and test calling');
      console.log('');
      console.log('📱 Phone Testing:');
      console.log('   1. Make sure your phone is connected to the same WiFi');
      console.log(`   2. Open: ${frontendScanUrl} on your phone browser`);
      console.log('   3. Should work the same as on computer');
      console.log('');
      console.log('🔧 QR Code Testing:');
      console.log('   1. Go to: http://192.168.1.19:3000/login');
      console.log('   2. Login and go to dashboard');
      console.log('   3. View your vehicle and regenerate QR code');
      console.log('   4. The new QR code should point to the IP address URL');
      console.log('');
      
    } else {
      console.error('❌ Backend scan API failed:', response.data.message);
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testScanUrl();
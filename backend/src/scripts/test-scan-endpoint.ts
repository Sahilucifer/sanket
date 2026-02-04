import axios from 'axios';

async function testScanEndpoint() {
  try {
    console.log('🧪 Testing Scan Endpoint...');

    const vehicleId = '1e56b7b4-916a-45c2-94d0-8f4d49c129f9';
    const scanApiUrl = `http://localhost:3001/api/scan/${vehicleId}`;

    console.log('📋 Testing scan API endpoint');
    console.log(`API URL: ${scanApiUrl}`);

    try {
      const response = await axios.get(scanApiUrl);
      
      console.log('✅ Scan API Response:');
      console.log('Status:', response.status);
      console.log('Success:', response.data.success);
      console.log('Vehicle Data:', {
        carNumber: response.data.data?.carNumber,
        isActive: response.data.data?.isActive,
        id: response.data.data?.id
      });

      if (response.data.success && response.data.data?.isActive) {
        console.log('✅ Vehicle is active and scan endpoint is working!');
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Clear your browser cache');
        console.log('2. Try the scan URL directly in browser:');
        console.log(`   http://192.168.1.19:3000/scan/${vehicleId}`);
        console.log('3. If still showing inactive, check browser console for errors');
      } else if (response.data.success && !response.data.data?.isActive) {
        console.log('❌ Vehicle is marked as inactive in scan response');
      } else {
        console.log('❌ Scan API returned error:', response.data.message);
      }

    } catch (error: any) {
      console.error('❌ Scan API request failed:', error.response?.data || error.message);
    }

    console.log('\n✅ Scan Endpoint Test Complete!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the test
testScanEndpoint();
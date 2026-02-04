import axios from 'axios';

async function fixQRDisplay() {
  try {
    console.log('🔧 Fixing QR Code Display Issue...');

    // Your vehicle ID (from the logs)
    const vehicleId = '1e56b7b4-916a-45c2-94d0-8f4d49c129f9';
    const apiUrl = 'http://localhost:3001';

    console.log('📋 Step 1: Getting current vehicle data');
    
    try {
      const vehicleResponse = await axios.get(`${apiUrl}/api/vehicles/${vehicleId}`);
      console.log('Current vehicle data:', {
        carNumber: vehicleResponse.data.data?.carNumber,
        qrUrl: vehicleResponse.data.data?.qrUrl,
        isActive: vehicleResponse.data.data?.isActive
      });
    } catch (error: any) {
      console.log('Vehicle data request failed (might need auth):', error.response?.status);
    }

    console.log('📋 Step 2: Testing QR regeneration endpoint');
    
    try {
      const response = await axios.post(`${apiUrl}/api/vehicles/${vehicleId}/qr/regenerate`);
      
      if (response.data.success) {
        console.log('✅ QR Code regenerated successfully!');
        console.log(`🔗 New QR URL: ${response.data.qrUrl}`);
        
        const scanUrl = `http://192.168.1.19:3000/scan/${vehicleId}`;
        
        console.log('');
        console.log('🎯 TESTING INSTRUCTIONS:');
        console.log('');
        console.log('1. Refresh your vehicle page in the browser');
        console.log('2. The QR code should now be visible');
        console.log('3. Click "View QR Code" or "Download QR Code"');
        console.log(`4. The QR code should redirect to: ${scanUrl}`);
        console.log('');
        console.log('📱 If QR code is still not visible:');
        console.log('1. Try clicking "Regenerate QR Code" button on the vehicle page');
        console.log('2. Check browser console for any errors');
        console.log('3. Make sure you are logged in');
        console.log('');
        
      } else {
        console.error('❌ Failed to regenerate QR code:', response.data.message);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required. Please:');
        console.log('1. Go to http://localhost:3000/login');
        console.log('2. Login with your phone number');
        console.log('3. Go to dashboard and view your vehicle');
        console.log('4. Click "Regenerate QR Code" button');
      } else {
        console.error('❌ API call failed:', error.response?.data || error.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Script failed:', error.message);
  }
}

// Run the fix
fixQRDisplay();
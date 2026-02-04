import axios from 'axios';

interface QRResponse {
  success: boolean;
  qrUrl?: string;
  message?: string;
}

async function regenerateQRViaAPI() {
  try {
    console.log('🔄 Regenerating QR Code via API...');

    const vehicleId = 'ceadfabd-aeba-4953-928b-8438c75b78dd';
    const apiUrl = 'http://localhost:3001';

    console.log('📋 Step 1: Regenerating QR Code');
    
    const response = await axios.post<QRResponse>(`${apiUrl}/api/vehicles/${vehicleId}/qr/regenerate`);
    
    if (response.data.success) {
      console.log('✅ QR Code regenerated successfully!');
      console.log(`🔗 New QR URL: ${response.data.qrUrl}`);
      
      const scanUrl = `http://192.168.1.19:3000/scan/${vehicleId}`;
      
      console.log('');
      console.log('🎯 TESTING INSTRUCTIONS:');
      console.log('');
      console.log('📱 Phone Testing (Real QR Scan):');
      console.log('   1. Make sure your phone is on the same WiFi network');
      console.log(`   2. Open QR image: ${response.data.qrUrl}`);
      console.log('   3. Scan with phone camera or QR scanner app');
      console.log(`   4. Should redirect to: ${scanUrl}`);
      console.log('');
      console.log('💻 Computer Testing (Direct URL):');
      console.log(`   1. Open: ${scanUrl}`);
      console.log('   2. Should show scan page for the vehicle');
      console.log('');
      console.log('🔧 Server Setup:');
      console.log('   1. Backend running at: http://192.168.1.19:3001');
      console.log('   2. Frontend running at: http://192.168.1.19:3000');
      console.log('');
      console.log('📋 Next Steps:');
      console.log('   1. Test the scan URL in your browser first');
      console.log('   2. Then test with phone QR scanning');
      console.log('   3. Try the masked calling feature');
      console.log('');
    } else {
      console.error('❌ Failed to regenerate QR code:', response.data.message);
    }

  } catch (error: any) {
    console.error('❌ API call failed:', error.response?.data || error.message);
  }
}

// Run the regeneration
regenerateQRViaAPI();
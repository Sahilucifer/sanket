#!/usr/bin/env node

/**
 * Complete authentication test with OTP verification and vehicle access
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testCompleteAuth() {
  try {
    console.log('🔧 Testing Complete Authentication Flow...\n');

    const testPhone = '+1234567890';
    
    // Step 1: Send OTP
    console.log('📱 Step 1: Send OTP...');
    const otpResponse = await axios.post(`${API_BASE}/auth/send-otp`, {
      phone: testPhone
    });
    console.log('✅ OTP sent:', (otpResponse.data as any).success);

    // Step 2: Get OTP from logs (in real app, user would enter this)
    console.log('\n🔐 Step 2: Verify OTP...');
    console.log('ℹ️  Check the backend logs above for the OTP (DEBUG - OTP for +1234567890: XXXXXX)');
    console.log('ℹ️  For this test, we\'ll use a common test OTP pattern');
    
    // Try to verify with a test OTP (you'll need to replace this with the actual OTP from logs)
    const testOTP = '579856'; // Replace with actual OTP from logs
    
    try {
      const verifyResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
        phoneNumber: testPhone,
        otp: testOTP
      });
      
      const authData = verifyResponse.data as any;
      console.log('✅ OTP verified successfully');
      console.log('✅ Auth token received');
      
      const authToken = authData.data.token;
      
      // Step 3: Test vehicles endpoint with auth token
      console.log('\n🚗 Step 3: Test vehicles endpoint with auth token...');
      const vehiclesResponse = await axios.get(`${API_BASE}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('✅ Vehicles endpoint accessible with auth token');
      console.log('Vehicles data:', (vehiclesResponse.data as any).data);
      
      // Step 4: Test vehicle creation
      console.log('\n🆕 Step 4: Test vehicle creation...');
      const createVehicleResponse = await axios.post(`${API_BASE}/vehicles`, {
        carNumber: 'TEST-' + Date.now()
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const newVehicle = (createVehicleResponse.data as any).data;
      console.log('✅ Vehicle created successfully');
      console.log('Vehicle ID:', newVehicle.id);
      console.log('QR URL:', newVehicle.qrUrl || 'NOT GENERATED');
      
      if (newVehicle.qrUrl) {
        console.log('🎉 QR code generated successfully!');
      } else {
        console.log('⚠️  QR code not generated - this is the issue we fixed');
      }
      
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('❌ OTP verification failed - please check the OTP from backend logs');
        console.log('Error:', error.response?.data?.message);
      } else {
        throw error;
      }
    }

  } catch (error: any) {
    console.log('❌ Complete auth test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

// Run the test
testCompleteAuth();
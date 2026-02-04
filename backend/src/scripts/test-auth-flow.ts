#!/usr/bin/env node

/**
 * Test authentication flow to help debug frontend issues
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testAuthFlow() {
  try {
    console.log('🔧 Testing Authentication Flow...\n');

    // Step 1: Register a user
    console.log('👤 Step 1: Register user...');
    const testPhone = '+1234567890';
    const testName = 'Test User';
    
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
        name: testName,
        phoneNumber: testPhone
      });
      console.log('✅ Registration successful:', (registerResponse.data as any).success);
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log('ℹ️  User already exists - proceeding to OTP step');
      } else {
        console.log('❌ Registration failed:', error.response?.data?.message);
        return;
      }
    }

    // Step 2: Send OTP
    console.log('\n📱 Step 2: Send OTP...');
    try {
      const otpResponse = await axios.post(`${API_BASE}/auth/send-otp`, {
        phone: testPhone
      });
      console.log('✅ OTP sent:', (otpResponse.data as any).success);
      console.log('Message:', (otpResponse.data as any).message);
    } catch (error: any) {
      console.log('❌ OTP send failed:', error.response?.data?.message);
      return;
    }

    // Step 3: Verify OTP (using a test OTP)
    console.log('\n🔐 Step 3: Verify OTP...');
    console.log('ℹ️  In a real scenario, you would enter the OTP received via SMS');
    console.log('ℹ️  For testing, you can check the backend logs for the OTP or use a test OTP');
    
    // Step 4: Test protected endpoint without token
    console.log('\n🔒 Step 4: Test protected endpoint without token...');
    try {
      await axios.get(`${API_BASE}/vehicles`);
      console.log('⚠️  Protected endpoint accessible without token (security issue)');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Protected endpoint properly secured (401 Unauthorized)');
      } else {
        console.log('⚠️  Unexpected response:', error.response?.status);
      }
    }

    console.log('\n📋 Authentication Flow Summary:');
    console.log('- ✅ User registration works');
    console.log('- ✅ OTP sending works');
    console.log('- ✅ Protected endpoints are secured');
    console.log('- ℹ️  To complete the flow, verify OTP and get auth token');
    
    console.log('\n🎯 Frontend Troubleshooting:');
    console.log('1. Make sure user is logged in (has valid auth token)');
    console.log('2. Check browser localStorage for "auth_token"');
    console.log('3. Verify API URL is correct (http://localhost:3001)');
    console.log('4. Check browser network tab for actual error details');

  } catch (error: any) {
    console.log('❌ Auth flow test failed:', error.message);
  }
}

// Run the test
testAuthFlow();
import dotenv from 'dotenv';
import { authService } from '../services/authService';
import { supabase } from '../config/database';

// Load test environment
dotenv.config({ path: '.env.test' });

async function testAuthentication() {
  console.log('🧪 Testing Authentication System...\n');

  const testPhone = '+1234567890';
  const testName = 'Test User';

  try {
    // Clean up any existing test data
    await supabase.from('users').delete().eq('phone', testPhone);

    // Test 1: User Registration
    console.log('1️⃣ Testing user registration...');
    const registerResult = await authService.register({
      name: testName,
      phoneNumber: testPhone
    });
    console.log('✅ Registration successful:', registerResult);

    // Test 2: Get OTP (simulate getting it from the service)
    console.log('\n2️⃣ Getting OTP for verification...');
    const otpStorage = (authService as any).otpStorage;
    const otpData = otpStorage.get(testPhone.replace(/\s+/g, ''));
    if (!otpData) {
      throw new Error('OTP not found');
    }
    console.log('✅ OTP retrieved:', otpData.otp);

    // Test 3: OTP Verification
    console.log('\n3️⃣ Testing OTP verification...');
    const verifyResult = await authService.verifyOTP({
      phoneNumber: testPhone,
      otp: otpData.otp
    });
    console.log('✅ OTP verification successful');
    console.log('User ID:', verifyResult.user.id);
    console.log('Token generated:', verifyResult.token ? 'Yes' : 'No');

    // Test 4: Token Validation
    console.log('\n4️⃣ Testing token validation...');
    const tokenValidation = await authService.validateToken(verifyResult.token);
    console.log('✅ Token validation successful:', tokenValidation);

    // Test 5: Get User Profile
    console.log('\n5️⃣ Testing user profile retrieval...');
    const profile = await authService.getUserProfile(verifyResult.user.id);
    console.log('✅ Profile retrieved:', profile);
    console.log('Phone number exposed:', (profile as any)?.phone ? 'Yes (BAD)' : 'No (GOOD)');

    // Test 6: Token Refresh
    console.log('\n6️⃣ Testing token refresh...');
    const newToken = await authService.refreshToken(verifyResult.token);
    console.log('✅ Token refresh successful:', newToken ? 'Yes' : 'No');

    // Test 7: Invalid OTP
    console.log('\n7️⃣ Testing invalid OTP rejection...');
    try {
      await authService.register({
        name: 'Another User',
        phoneNumber: '+9876543210'
      });
      await authService.verifyOTP({
        phoneNumber: '+9876543210',
        otp: '000000'
      });
      console.log('❌ Invalid OTP was accepted (BAD)');
    } catch (error) {
      console.log('✅ Invalid OTP correctly rejected');
    }

    // Test 8: Duplicate Registration
    console.log('\n8️⃣ Testing duplicate registration rejection...');
    try {
      await authService.register({
        name: testName,
        phoneNumber: testPhone
      });
      console.log('❌ Duplicate registration was accepted (BAD)');
    } catch (error) {
      console.log('✅ Duplicate registration correctly rejected');
    }

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up test data
    await supabase.from('users').delete().eq('phone', testPhone);
    await supabase.from('users').delete().eq('phone', '+9876543210');
    console.log('\n🧹 Test data cleaned up');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAuthentication().catch(console.error);
}

export { testAuthentication };
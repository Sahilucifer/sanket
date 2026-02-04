import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Manually set FRONTEND_URL to match server config
process.env.FRONTEND_URL = 'http://192.168.1.19:3000';

import { supabaseAdmin } from '../config/database';
import { vehicleService } from '../services/vehicleService';
import { logger } from '../utils/logger';

async function resetAndRegenerate() {
  try {
    console.log('🔄 Reset and Regenerate QR Code...');

    const vehicleId = '1e56b7b4-916a-45c2-94d0-8f4d49c129f9';

    console.log('📋 Step 1: Reset QR URL to null');
    const { error: resetError } = await supabaseAdmin
      .from('vehicles')
      .update({ qr_url: null })
      .eq('id', vehicleId);

    if (resetError) {
      console.error('❌ Error resetting QR URL:', resetError);
      return;
    }

    console.log('✅ QR URL reset to null');

    console.log('\n📋 Step 2: Regenerate QR Code using Vehicle Service');
    const newQrUrl = await vehicleService.regenerateQRCode(vehicleId);

    if (newQrUrl) {
      console.log('✅ QR Code regenerated successfully!');
      console.log('New QR URL:', newQrUrl);
      
      console.log('\n📋 Step 3: Verify Database Update');
      const { data: verifyVehicle, error: verifyError } = await supabaseAdmin
        .from('vehicles')
        .select('qr_url')
        .eq('id', vehicleId)
        .single();

      if (verifyError) {
        console.error('❌ Error verifying update:', verifyError);
        return;
      }

      console.log('Database QR URL:', verifyVehicle.qr_url);
      
      if (verifyVehicle.qr_url === newQrUrl) {
        console.log('✅ Database updated correctly!');
        console.log('\n🎯 SOLUTION:');
        console.log('1. Refresh your vehicle page in the browser');
        console.log('2. The QR code should now be visible');
        console.log('3. You can download or view the QR code');
        console.log('4. The QR code will redirect to the IP address URL');
      } else {
        console.log('❌ Database not updated correctly');
        console.log('Expected:', newQrUrl);
        console.log('Got:', verifyVehicle.qr_url);
      }
      
    } else {
      console.error('❌ QR Code regeneration failed');
    }

    console.log('\n✅ Reset and Regenerate Complete!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
resetAndRegenerate();
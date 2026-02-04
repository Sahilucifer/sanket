import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Manually set FRONTEND_URL to match server config
process.env.FRONTEND_URL = 'http://192.168.1.19:3000';

import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';

async function debugDBUpdate() {
  try {
    console.log('🔍 Debugging Database Update Issue...');

    const vehicleId = '1e56b7b4-916a-45c2-94d0-8f4d49c129f9';
    const testQrUrl = 'https://example.com/test-qr.png';

    console.log('📋 Step 1: Check Current Vehicle Data');
    const { data: currentVehicle, error: fetchError } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching vehicle:', fetchError);
      return;
    }

    console.log('Current vehicle data:', {
      id: currentVehicle.id,
      car_number: currentVehicle.car_number,
      qr_url: currentVehicle.qr_url,
      is_active: currentVehicle.is_active
    });

    console.log('\n📋 Step 2: Test Database Update');
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('vehicles')
      .update({ 
        qr_url: testQrUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicleId)
      .select();

    if (updateError) {
      console.error('❌ Error updating vehicle:', updateError);
      return;
    }

    console.log('✅ Update successful, returned data:', updateData);

    console.log('\n📋 Step 3: Verify Update');
    const { data: verifyVehicle, error: verifyError } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }

    console.log('Updated vehicle data:', {
      id: verifyVehicle.id,
      car_number: verifyVehicle.car_number,
      qr_url: verifyVehicle.qr_url,
      is_active: verifyVehicle.is_active
    });

    console.log('\n✅ Database Update Debug Complete!');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug
debugDBUpdate();
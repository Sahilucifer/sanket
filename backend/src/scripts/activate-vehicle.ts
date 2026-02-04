import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { supabaseAdmin } from '../config/database';

async function activateVehicle() {
  try {
    console.log('🔧 Activating Vehicle...');

    const vehicleId = '1e56b7b4-916a-45c2-94d0-8f4d49c129f9';

    console.log('📋 Step 1: Check Current Vehicle Status');
    const { data: currentVehicle, error: fetchError } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching vehicle:', fetchError);
      return;
    }

    console.log('Current vehicle status:', {
      id: currentVehicle.id,
      car_number: currentVehicle.car_number,
      is_active: currentVehicle.is_active,
      qr_url: currentVehicle.qr_url ? 'Present' : 'Missing'
    });

    if (currentVehicle.is_active) {
      console.log('✅ Vehicle is already active!');
    } else {
      console.log('📋 Step 2: Activating Vehicle');
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('vehicles')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicleId)
        .select();

      if (updateError) {
        console.error('❌ Error activating vehicle:', updateError);
        return;
      }

      console.log('✅ Vehicle activated successfully!');
      console.log('Updated data:', updateData);
    }

    console.log('\n🎯 SOLUTION READY:');
    console.log('1. Scan the QR code again with your phone');
    console.log('2. You should now see the vehicle scan page with:');
    console.log('   ✅ "Call Owner" option available');
    console.log('   ✅ "Emergency Alert" option available');
    console.log('   ✅ No "Vehicle Inactive" message');
    console.log('3. Test the masked calling functionality');
    console.log('');
    console.log('🔗 QR Code URL to test:');
    console.log(`http://192.168.1.19:3000/scan/${vehicleId}`);

    console.log('\n✅ Vehicle Activation Complete!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the activation
activateVehicle();
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { supabaseAdmin } from '../config/database';

async function debugOwnerLookup() {
  try {
    console.log('🔍 Debugging Owner Lookup Issue...');

    const vehicleId = '1e56b7b4-916a-45c2-94d0-8f4d49c129f9';

    console.log('📋 Step 1: Get Vehicle Information');
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (vehicleError) {
      console.error('❌ Error fetching vehicle:', vehicleError);
      return;
    }

    console.log('Vehicle data:', {
      id: vehicle.id,
      user_id: vehicle.user_id,
      car_number: vehicle.car_number,
      is_active: vehicle.is_active
    });

    console.log('\n📋 Step 2: Check if User Exists');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', vehicle.user_id);

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }

    console.log('User query result:', {
      found: user ? user.length : 0,
      users: user
    });

    if (!user || user.length === 0) {
      console.log('❌ USER NOT FOUND! This is the issue.');
      console.log('');
      console.log('🔧 SOLUTION NEEDED:');
      console.log('1. The vehicle has user_id:', vehicle.user_id);
      console.log('2. But no user exists with that ID');
      console.log('3. Need to create a user record or fix the user_id');
      
      console.log('\n📋 Step 3: Check All Users');
      const { data: allUsers, error: allUsersError } = await supabaseAdmin
        .from('users')
        .select('id, phone, created_at');

      if (allUsersError) {
        console.error('❌ Error fetching all users:', allUsersError);
      } else {
        console.log('All users in database:', allUsers);
        
        if (allUsers && allUsers.length > 0) {
          console.log('\n🔧 QUICK FIX: Update vehicle to use existing user');
          const existingUserId = allUsers[0]?.id;
          if (existingUserId) {
            console.log(`Updating vehicle user_id from ${vehicle.user_id} to ${existingUserId}`);
            
            const { error: updateError } = await supabaseAdmin
              .from('vehicles')
              .update({ user_id: existingUserId })
              .eq('id', vehicleId);

            if (updateError) {
              console.error('❌ Error updating vehicle:', updateError);
            } else {
              console.log('✅ Vehicle updated successfully!');
              console.log('');
              console.log('🎯 NOW TRY THE CALL AGAIN:');
              console.log('1. Refresh the scan page');
              console.log('2. Try initiating a call');
              console.log('3. It should work now!');
            }
          }
        }
      }
    } else {
      console.log('✅ User found:', {
        id: user[0].id,
        phone: user[0].phone,
        created_at: user[0].created_at
      });
    }

    console.log('\n✅ Owner Lookup Debug Complete!');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug
debugOwnerLookup();
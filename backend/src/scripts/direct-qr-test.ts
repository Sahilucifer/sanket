import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Manually set FRONTEND_URL to match server config
process.env.FRONTEND_URL = 'http://192.168.1.19:3000';

import { QRCodeService } from '../services/qrCodeService';
import { supabaseAdmin } from '../config/database';

async function directQRTest() {
  try {
    console.log('🧪 Direct QR Code Service Test...');

    const vehicleId = '1e56b7b4-916a-45c2-94d0-8f4d49c129f9';
    const qrCodeService = new QRCodeService();

    console.log('📋 Step 1: Test QR Code Generation');
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('Expected scan URL:', qrCodeService.getScanUrl(vehicleId));

    try {
      const qrUrl = await qrCodeService.generateQRCode(vehicleId);
      
      if (qrUrl) {
        console.log('✅ QR Code generated successfully!');
        console.log('QR URL:', qrUrl);
        
        console.log('\n📋 Step 2: Update Database Directly');
        const { data, error } = await supabaseAdmin
          .from('vehicles')
          .update({ 
            qr_url: qrUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vehicleId)
          .select();

        if (error) {
          console.error('❌ Database update error:', error);
        } else {
          console.log('✅ Database updated successfully!');
          console.log('Updated data:', data);
          
          console.log('\n🎯 SOLUTION READY:');
          console.log('1. Refresh your browser page');
          console.log('2. The QR code should now be visible');
          console.log('3. You can download or view the QR code');
          console.log(`4. QR code URL: ${qrUrl}`);
        }
        
      } else {
        console.error('❌ QR Code generation returned null');
      }
    } catch (genError) {
      console.error('❌ QR Code generation error:', genError);
    }

    console.log('\n✅ Direct QR Test Complete!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the test
directQRTest();
import dotenv from 'dotenv';
import { supabaseAdmin } from '../config/database';
import { QRCodeService } from '../services/qrCodeService';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function fixMissingQRCodes() {
  try {
    logger.info('🔧 Fixing Missing QR Codes...');

    const qrCodeService = new QRCodeService();

    // Get all vehicles without QR codes
    const { data: vehicles, error } = await supabaseAdmin
      .from('vehicles')
      .select('id, car_number, qr_url')
      .is('qr_url', null)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch vehicles: ${error.message}`);
    }

    if (!vehicles || vehicles.length === 0) {
      logger.info('✅ No vehicles found without QR codes');
      return;
    }

    logger.info(`📋 Found ${vehicles.length} vehicles without QR codes`);

    for (const vehicle of vehicles) {
      try {
        logger.info(`🔄 Generating QR code for vehicle: ${vehicle.car_number} (${vehicle.id})`);
        
        // Generate QR code
        const qrUrl = await qrCodeService.generateQRCode(vehicle.id);
        
        if (qrUrl) {
          // Update vehicle with QR URL
          const { error: updateError } = await supabaseAdmin
            .from('vehicles')
            .update({ 
              qr_url: qrUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', vehicle.id);

          if (updateError) {
            logger.error(`Failed to update vehicle ${vehicle.id}:`, updateError);
          } else {
            logger.info(`✅ QR code generated for ${vehicle.car_number}: ${qrUrl}`);
          }
        } else {
          logger.error(`❌ Failed to generate QR code for vehicle ${vehicle.id}`);
        }
      } catch (vehicleError) {
        logger.error(`Error processing vehicle ${vehicle.id}:`, vehicleError);
      }
    }

    logger.info('✅ QR Code Fix Completed!');

  } catch (error) {
    logger.error('❌ QR Code Fix Failed:', error);
    throw error;
  }
}

// Run the fix
fixMissingQRCodes()
  .then(() => {
    logger.info('🎉 Fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Fix failed:', error);
    process.exit(1);
  });
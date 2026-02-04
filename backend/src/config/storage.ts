import { supabaseAdmin } from './database';
import { logger } from '../utils/logger';

const STORAGE_BUCKET = 'qr-codes';

// Initialize storage bucket
export const initializeStorage = async (): Promise<void> => {
  try {
    // Check if bucket exists using admin client
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      logger.error('Error listing storage buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);

    if (!bucketExists) {
      // Create bucket if it doesn't exist using admin client
      const { error: createError } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg'],
        fileSizeLimit: 1024 * 1024, // 1MB
      });

      if (createError) {
        logger.error('Error creating storage bucket:', createError);
        return;
      }

      logger.info(`Storage bucket '${STORAGE_BUCKET}' created successfully`);
    } else {
      logger.info(`Storage bucket '${STORAGE_BUCKET}' already exists`);
    }
  } catch (error) {
    logger.error('Error initializing storage:', error);
  }
};

// Upload QR code image
export const uploadQRCode = async (
  vehicleId: string, 
  imageBuffer: Buffer, 
  contentType: string = 'image/png'
): Promise<string | null> => {
  try {
    const fileName = `${vehicleId}.png`;
    const filePath = `qr-codes/${fileName}`;

    // Use admin client for upload to bypass RLS
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, imageBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      logger.error('Error uploading QR code:', error);
      return null;
    }

    // Get public URL using admin client
    const { data } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    logger.error('Error uploading QR code:', error);
    return null;
  }
};

// Delete QR code image
export const deleteQRCode = async (vehicleId: string): Promise<boolean> => {
  try {
    const filePath = `qr-codes/${vehicleId}.png`;

    // Use admin client for delete to bypass RLS
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      logger.error('Error deleting QR code:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error deleting QR code:', error);
    return false;
  }
};
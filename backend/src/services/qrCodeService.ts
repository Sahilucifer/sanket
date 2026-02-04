import QRCode from 'qrcode';
import { logger } from '../utils/logger';
import { uploadQRCode, deleteQRCode } from '../config/storage';

export class QRCodeService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Generate QR code for a vehicle
   * @param vehicleId - The vehicle ID
   * @returns Promise<string | null> - The QR code image URL or null if failed
   */
  async generateQRCode(vehicleId: string): Promise<string | null> {
    try {
      // Create the scan URL
      const scanUrl = `${this.baseUrl}/scan/${vehicleId}`;

      // Generate QR code as buffer
      const qrCodeBuffer = await QRCode.toBuffer(scanUrl, {
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      });

      // Upload to storage
      const qrUrl = await uploadQRCode(vehicleId, qrCodeBuffer, 'image/png');

      if (!qrUrl) {
        logger.error(`Failed to upload QR code for vehicle: ${vehicleId}`);
        return null;
      }

      logger.info(`QR code generated and uploaded successfully for vehicle: ${vehicleId}`);
      return qrUrl;
    } catch (error) {
      logger.error(`Error generating QR code for vehicle ${vehicleId}:`, error);
      return null;
    }
  }

  /**
   * Delete QR code for a vehicle
   * @param vehicleId - The vehicle ID
   * @returns Promise<boolean> - True if deleted successfully, false otherwise
   */
  async deleteQRCode(vehicleId: string): Promise<boolean> {
    try {
      const deleted = await deleteQRCode(vehicleId);
      
      if (deleted) {
        logger.info(`QR code deleted successfully for vehicle: ${vehicleId}`);
      } else {
        logger.warn(`Failed to delete QR code for vehicle: ${vehicleId}`);
      }

      return deleted;
    } catch (error) {
      logger.error(`Error deleting QR code for vehicle ${vehicleId}:`, error);
      return false;
    }
  }

  /**
   * Regenerate QR code for a vehicle
   * @param vehicleId - The vehicle ID
   * @returns Promise<string | null> - The new QR code image URL or null if failed
   */
  async regenerateQRCode(vehicleId: string): Promise<string | null> {
    try {
      // Delete existing QR code (if any)
      await this.deleteQRCode(vehicleId);

      // Generate new QR code
      return await this.generateQRCode(vehicleId);
    } catch (error) {
      logger.error(`Error regenerating QR code for vehicle ${vehicleId}:`, error);
      return null;
    }
  }

  /**
   * Get scan URL for a vehicle
   * @param vehicleId - The vehicle ID
   * @returns string - The scan URL
   */
  getScanUrl(vehicleId: string): string {
    return `${this.baseUrl}/scan/${vehicleId}`;
  }

  /**
   * Validate QR code configuration
   * @returns boolean - True if configuration is valid
   */
  validateConfiguration(): boolean {
    if (!this.baseUrl) {
      logger.error('QR Code Service: FRONTEND_URL not configured');
      return false;
    }

    return true;
  }
}
import { scanService } from '../services/scanService';
import { supabase } from '../config/database';

describe('ScanService', () => {
  let testVehicleId: string;

  beforeAll(async () => {
    // Create a test user first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        name: 'Test User',
        phone: '+1234567890',
        is_verified: true
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }

    // Create a test vehicle
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        user_id: userData.id,
        car_number: 'TEST123',
        is_active: true
      })
      .select()
      .single();

    if (vehicleError) {
      throw new Error(`Failed to create test vehicle: ${vehicleError.message}`);
    }

    testVehicleId = vehicleData.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testVehicleId) {
      await supabase.from('vehicles').delete().eq('id', testVehicleId);
    }
    await supabase.from('users').delete().eq('phone', '+1234567890');
  });

  describe('getVehicleForScan', () => {
    it('should return vehicle information for valid active vehicle', async () => {
      const vehicle = await scanService.getVehicleForScan(testVehicleId);
      
      expect(vehicle).toBeTruthy();
      expect(vehicle?.id).toBe(testVehicleId);
      expect(vehicle?.carNumber).toBe('TEST123');
      expect(vehicle?.userId).toBe(''); // Should be empty for privacy
      expect(vehicle?.qrUrl).toBeNull(); // Should be null for privacy
    });

    it('should return null for non-existent vehicle', async () => {
      const vehicle = await scanService.getVehicleForScan('00000000-0000-0000-0000-000000000000');
      expect(vehicle).toBeNull();
    });
  });

  describe('logScan', () => {
    it('should log scan event successfully', async () => {
      const scanLog = await scanService.logScan(
        testVehicleId,
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      expect(scanLog).toBeTruthy();
      expect(scanLog.vehicleId).toBe(testVehicleId);
      expect(scanLog.ipAddress).toBe('192.168.1.1');
      expect(scanLog.scannedAt).toBeInstanceOf(Date);
    });

    it('should handle null IP address and user agent', async () => {
      const scanLog = await scanService.logScan(testVehicleId, null, null);

      expect(scanLog).toBeTruthy();
      expect(scanLog.vehicleId).toBe(testVehicleId);
      expect(scanLog.ipAddress).toBeNull();
      expect(scanLog.userAgent).toBeNull();
    });
  });

  describe('getScanLogs', () => {
    it('should return scan logs for vehicle', async () => {
      // First create a scan log
      await scanService.logScan(testVehicleId, '192.168.1.2', 'Test User Agent');

      const logs = await scanService.getScanLogs(testVehicleId, 10);
      
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]?.vehicleId).toBe(testVehicleId);
    });
  });

  describe('getVehicleScanStats', () => {
    it('should return scan statistics for vehicle', async () => {
      const stats = await scanService.getVehicleScanStats(testVehicleId);
      
      expect(stats).toBeTruthy();
      expect(stats.vehicleId).toBe(testVehicleId);
      expect(typeof stats.totalScans).toBe('number');
      expect(typeof stats.scansLast24Hours).toBe('number');
      expect(typeof stats.uniqueIPs).toBe('number');
    });
  });
});
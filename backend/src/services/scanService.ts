import { supabase } from '../config/database';
import { logger } from '../utils/logger';
import { Vehicle, ScanLog, ScanAnalytics, VehicleScanStats } from '../types';

export class ScanService {
  /**
   * Get vehicle information for scan page (without exposing personal data)
   * This method ensures strict privacy protection by only returning
   * the minimum necessary information for the scan page
   */
  async getVehicleForScan(vehicleId: string): Promise<Vehicle | null> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, car_number, is_active, created_at, updated_at')
        .eq('id', vehicleId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - vehicle not found or inactive
          return null;
        }
        logger.error('Error fetching vehicle for scan:', error);
        throw new Error('Failed to fetch vehicle information');
      }

      // Return vehicle data with strict privacy protection
      // Explicitly exclude user_id, qr_url, and any other sensitive data
      return {
        id: data.id,
        userId: '', // Never expose user_id for privacy
        carNumber: data.car_number,
        qrUrl: null, // Never expose qr_url for privacy
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      logger.error('Error in getVehicleForScan:', error);
      throw error;
    }
  }

  /**
   * Log a scan event with comprehensive metadata
   * Captures IP address, user agent, timestamp, and other relevant information
   */
  async logScan(vehicleId: string, ipAddress: string | null, userAgent: string | null): Promise<ScanLog> {
    try {
      // Extract additional metadata from user agent if available
      const metadata = this.extractUserAgentMetadata(userAgent);
      
      const { data, error } = await supabase
        .from('scan_logs')
        .insert({
          vehicle_id: vehicleId,
          ip_address: ipAddress,
          user_agent: userAgent,
          scanned_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error logging scan:', error);
        throw new Error('Failed to log scan event');
      }

      const scanLog: ScanLog = {
        id: data.id,
        vehicleId: data.vehicle_id,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        scannedAt: new Date(data.scanned_at)
      };

      logger.info('Scan event logged successfully', {
        scanId: scanLog.id,
        vehicleId: scanLog.vehicleId,
        ipAddress: scanLog.ipAddress,
        timestamp: scanLog.scannedAt,
        ...metadata
      });

      return scanLog;
    } catch (error) {
      logger.error('Error in logScan:', error);
      throw error;
    }
  }

  /**
   * Extract metadata from user agent string for enhanced logging
   */
  private extractUserAgentMetadata(userAgent: string | null): Record<string, any> {
    if (!userAgent) {
      return { browser: 'unknown', os: 'unknown', device: 'unknown' };
    }

    const metadata: Record<string, any> = {
      browser: 'unknown',
      os: 'unknown',
      device: 'unknown'
    };

    // Simple user agent parsing (in production, consider using a library like ua-parser-js)
    if (userAgent.includes('Chrome')) metadata.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) metadata.browser = 'Firefox';
    else if (userAgent.includes('Safari')) metadata.browser = 'Safari';
    else if (userAgent.includes('Edge')) metadata.browser = 'Edge';

    if (userAgent.includes('Windows')) metadata.os = 'Windows';
    else if (userAgent.includes('Mac')) metadata.os = 'macOS';
    else if (userAgent.includes('Linux')) metadata.os = 'Linux';
    else if (userAgent.includes('Android')) metadata.os = 'Android';
    else if (userAgent.includes('iOS')) metadata.os = 'iOS';

    if (userAgent.includes('Mobile')) metadata.device = 'Mobile';
    else if (userAgent.includes('Tablet')) metadata.device = 'Tablet';
    else metadata.device = 'Desktop';

    return metadata;
  }

  /**
   * Get scan logs for a vehicle (for admin/owner use)
   */
  async getScanLogs(vehicleId: string, limit: number = 50): Promise<ScanLog[]> {
    try {
      const { data, error } = await supabase
        .from('scan_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('scanned_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching scan logs:', error);
        throw new Error('Failed to fetch scan logs');
      }

      return data.map(log => ({
        id: log.id,
        vehicleId: log.vehicle_id,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        scannedAt: new Date(log.scanned_at)
      }));
    } catch (error) {
      logger.error('Error in getScanLogs:', error);
      throw error;
    }
  }

  /**
   * Get scan logs with advanced filtering capabilities
   * Supports filtering by vehicle, date range, IP address, and more
   */
  async getScanLogsWithFilters(
    vehicleId?: string,
    startDate?: Date,
    endDate?: Date,
    ipAddress?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: ScanLog[]; total: number; analytics: ScanAnalytics }> {
    try {
      let query = supabase
        .from('scan_logs')
        .select('*', { count: 'exact' });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      if (startDate) {
        query = query.gte('scanned_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('scanned_at', endDate.toISOString());
      }

      if (ipAddress) {
        query = query.eq('ip_address', ipAddress);
      }

      const { data, error, count } = await query
        .order('scanned_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Error fetching filtered scan logs:', error);
        throw new Error('Failed to fetch scan logs');
      }

      const logs = data.map(log => ({
        id: log.id,
        vehicleId: log.vehicle_id,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        scannedAt: new Date(log.scanned_at)
      }));

      // Generate analytics for the filtered results
      const analytics = await this.generateScanAnalytics(vehicleId, startDate, endDate);

      return {
        logs,
        total: count || 0,
        analytics
      };
    } catch (error) {
      logger.error('Error in getScanLogsWithFilters:', error);
      throw error;
    }
  }

  /**
   * Generate analytics for scan logs
   */
  async generateScanAnalytics(
    vehicleId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ScanAnalytics> {
    try {
      let query = supabase.from('scan_logs').select('*');

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      if (startDate) {
        query = query.gte('scanned_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('scanned_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error generating scan analytics:', error);
        throw new Error('Failed to generate analytics');
      }

      // Calculate analytics
      const totalScans = data.length;
      const uniqueIPs = new Set(data.map((log: any) => log.ip_address).filter((ip: any) => ip)).size;
      
      // Group by hour for trend analysis
      const scansByHour: Record<string, number> = {};
      const scansByDay: Record<string, number> = {};
      
      data.forEach((log: any) => {
        const date = new Date(log.scanned_at);
        const hour = date.toISOString().substring(0, 13); // YYYY-MM-DDTHH
        const day = date.toISOString().substring(0, 10); // YYYY-MM-DD
        
        scansByHour[hour] = (scansByHour[hour] || 0) + 1;
        scansByDay[day] = (scansByDay[day] || 0) + 1;
      });

      // Find peak hours
      const peakHour = Object.entries(scansByHour)
        .sort(([,a], [,b]) => b - a)[0];

      return {
        totalScans,
        uniqueIPs,
        scansByHour,
        scansByDay,
        peakHour: peakHour ? { hour: peakHour[0], count: peakHour[1] } : null,
        averageScansPerDay: totalScans / Math.max(Object.keys(scansByDay).length, 1)
      };
    } catch (error) {
      logger.error('Error in generateScanAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get scan statistics for a specific vehicle
   */
  async getVehicleScanStats(vehicleId: string): Promise<VehicleScanStats> {
    try {
      const { data, error } = await supabase
        .from('scan_logs')
        .select('*')
        .eq('vehicle_id', vehicleId);

      if (error) {
        logger.error('Error fetching vehicle scan stats:', error);
        throw new Error('Failed to fetch scan statistics');
      }

      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalScans = data.length;
      const scansLast24Hours = data.filter(log => new Date(log.scanned_at) >= last24Hours).length;
      const scansLast7Days = data.filter(log => new Date(log.scanned_at) >= last7Days).length;
      const scansLast30Days = data.filter(log => new Date(log.scanned_at) >= last30Days).length;

      const firstScan = data.length > 0 ? 
        new Date(Math.min(...data.map(log => new Date(log.scanned_at).getTime()))) : null;
      const lastScan = data.length > 0 ? 
        new Date(Math.max(...data.map(log => new Date(log.scanned_at).getTime()))) : null;

      return {
        vehicleId,
        totalScans,
        scansLast24Hours,
        scansLast7Days,
        scansLast30Days,
        firstScan,
        lastScan,
        uniqueIPs: new Set(data.map(log => log.ip_address).filter(ip => ip)).size
      };
    } catch (error) {
      logger.error('Error in getVehicleScanStats:', error);
      throw error;
    }
  }
}

export const scanService = new ScanService();
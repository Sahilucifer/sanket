import { supabase } from '../config/database';
import { logger } from '../utils/logger';
import { CallLog, AlertLog, ScanLog } from '../types';

export interface CallLogEntry {
  vehicleId: string;
  callerNumber: string;
  ownerNumber: string;
  callSid?: string;
  status: 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed' | 'no-answer';
  duration?: number;
  startedAt?: Date;
  endedAt?: Date;
}

export interface AlertLogEntry {
  vehicleId: string;
  alertType: 'emergency_call' | 'emergency_sms';
  message: string;
  status: 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
}

export interface ScanLogEntry {
  vehicleId: string;
  ipAddress?: string;
  userAgent?: string;
  scannedAt?: Date;
}

export interface LogQueryFilters {
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  eventType?: 'call' | 'alert' | 'scan';
  limit?: number;
  offset?: number;
}

export interface LogQueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

export class LogService {
  /**
   * Create a call log entry
   */
  async createCallLog(entry: CallLogEntry): Promise<CallLog> {
    try {
      logger.info('Creating call log entry', {
        vehicleId: entry.vehicleId,
        caller: this.maskPhoneNumber(entry.callerNumber),
        owner: this.maskPhoneNumber(entry.ownerNumber),
        status: entry.status,
      });

      const { data, error } = await supabase
        .from('call_logs')
        .insert({
          vehicle_id: entry.vehicleId,
          caller_number: entry.callerNumber,
          owner_number: entry.ownerNumber,
          call_sid: entry.callSid || null,
          status: entry.status,
          duration: entry.duration || 0,
          started_at: entry.startedAt?.toISOString() || null,
          ended_at: entry.endedAt?.toISOString() || null,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create call log', { error: error.message, entry });
        throw new Error(`Failed to create call log: ${error.message}`);
      }

      const callLog: CallLog = {
        id: data.id,
        vehicleId: data.vehicle_id,
        callerNumber: data.caller_number,
        ownerNumber: data.owner_number,
        callSid: data.call_sid,
        status: data.status,
        duration: data.duration,
        startedAt: data.started_at ? new Date(data.started_at) : null,
        endedAt: data.ended_at ? new Date(data.ended_at) : null,
        createdAt: new Date(data.created_at),
      };

      logger.info('Call log created successfully', { id: callLog.id });
      return callLog;
    } catch (error: any) {
      logger.error('Error creating call log', { error: error.message, entry });
      throw error;
    }
  }

  /**
   * Update an existing call log entry
   */
  async updateCallLog(id: string, updates: Partial<CallLogEntry>): Promise<CallLog> {
    try {
      logger.info('Updating call log entry', { id, updates });

      const updateData: any = {};
      if (updates.status) updateData.status = updates.status;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.startedAt) updateData.started_at = updates.startedAt.toISOString();
      if (updates.endedAt) updateData.ended_at = updates.endedAt.toISOString();
      if (updates.callSid) updateData.call_sid = updates.callSid;

      const { data, error } = await supabase
        .from('call_logs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update call log', { error: error.message, id, updates });
        throw new Error(`Failed to update call log: ${error.message}`);
      }

      const callLog: CallLog = {
        id: data.id,
        vehicleId: data.vehicle_id,
        callerNumber: data.caller_number,
        ownerNumber: data.owner_number,
        callSid: data.call_sid,
        status: data.status,
        duration: data.duration,
        startedAt: data.started_at ? new Date(data.started_at) : null,
        endedAt: data.ended_at ? new Date(data.ended_at) : null,
        createdAt: new Date(data.created_at),
      };

      logger.info('Call log updated successfully', { id });
      return callLog;
    } catch (error: any) {
      logger.error('Error updating call log', { error: error.message, id, updates });
      throw error;
    }
  }

  /**
   * Query call logs with filtering and pagination
   */
  async queryCallLogs(filters: LogQueryFilters = {}): Promise<LogQueryResult<CallLog>> {
    try {
      logger.info('Querying call logs', { filters });

      let query = supabase
        .from('call_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by created_at descending
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to query call logs', { error: error.message, filters });
        throw new Error(`Failed to query call logs: ${error.message}`);
      }

      const callLogs: CallLog[] = (data || []).map(row => ({
        id: row.id,
        vehicleId: row.vehicle_id,
        callerNumber: row.caller_number,
        ownerNumber: row.owner_number,
        callSid: row.call_sid,
        status: row.status,
        duration: row.duration,
        startedAt: row.started_at ? new Date(row.started_at) : null,
        endedAt: row.ended_at ? new Date(row.ended_at) : null,
        createdAt: new Date(row.created_at),
      }));

      const total = count || 0;
      const hasMore = offset + limit < total;

      logger.info('Call logs queried successfully', {
        count: callLogs.length,
        total,
        hasMore,
      });

      return { data: callLogs, total, hasMore };
    } catch (error: any) {
      logger.error('Error querying call logs', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * Create an alert log entry
   */
  async createAlertLog(entry: AlertLogEntry): Promise<AlertLog> {
    try {
      logger.info('Creating alert log entry', {
        vehicleId: entry.vehicleId,
        alertType: entry.alertType,
        status: entry.status,
        messageLength: entry.message.length,
      });

      const { data, error } = await supabase
        .from('alert_logs')
        .insert({
          vehicle_id: entry.vehicleId,
          alert_type: entry.alertType,
          message: entry.message,
          status: entry.status,
          sent_at: entry.sentAt?.toISOString() || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create alert log', { error: error.message, entry });
        throw new Error(`Failed to create alert log: ${error.message}`);
      }

      const alertLog: AlertLog = {
        id: data.id,
        vehicleId: data.vehicle_id,
        alertType: data.alert_type,
        message: data.message,
        status: data.status,
        sentAt: new Date(data.sent_at),
        createdAt: new Date(data.created_at),
      };

      logger.info('Alert log created successfully', { id: alertLog.id });
      return alertLog;
    } catch (error: any) {
      logger.error('Error creating alert log', { error: error.message, entry });
      throw error;
    }
  }

  /**
   * Update an existing alert log entry
   */
  async updateAlertLog(id: string, updates: Partial<AlertLogEntry>): Promise<AlertLog> {
    try {
      logger.info('Updating alert log entry', { id, updates });

      const updateData: any = {};
      if (updates.status) updateData.status = updates.status;
      if (updates.message) updateData.message = updates.message;

      const { data, error } = await supabase
        .from('alert_logs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update alert log', { error: error.message, id, updates });
        throw new Error(`Failed to update alert log: ${error.message}`);
      }

      const alertLog: AlertLog = {
        id: data.id,
        vehicleId: data.vehicle_id,
        alertType: data.alert_type,
        message: data.message,
        status: data.status,
        sentAt: new Date(data.sent_at),
        createdAt: new Date(data.created_at),
      };

      logger.info('Alert log updated successfully', { id });
      return alertLog;
    } catch (error: any) {
      logger.error('Error updating alert log', { error: error.message, id, updates });
      throw error;
    }
  }

  /**
   * Query alert logs with filtering and pagination
   */
  async queryAlertLogs(filters: LogQueryFilters = {}): Promise<LogQueryResult<AlertLog>> {
    try {
      logger.info('Querying alert logs', { filters });

      let query = supabase
        .from('alert_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by created_at descending
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to query alert logs', { error: error.message, filters });
        throw new Error(`Failed to query alert logs: ${error.message}`);
      }

      const alertLogs: AlertLog[] = (data || []).map(row => ({
        id: row.id,
        vehicleId: row.vehicle_id,
        alertType: row.alert_type,
        message: row.message,
        status: row.status,
        sentAt: new Date(row.sent_at),
        createdAt: new Date(row.created_at),
      }));

      const total = count || 0;
      const hasMore = offset + limit < total;

      logger.info('Alert logs queried successfully', {
        count: alertLogs.length,
        total,
        hasMore,
      });

      return { data: alertLogs, total, hasMore };
    } catch (error: any) {
      logger.error('Error querying alert logs', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * Create a scan log entry
   */
  async createScanLog(entry: ScanLogEntry): Promise<ScanLog> {
    try {
      logger.info('Creating scan log entry', {
        vehicleId: entry.vehicleId,
        ipAddress: entry.ipAddress,
      });

      const { data, error } = await supabase
        .from('scan_logs')
        .insert({
          vehicle_id: entry.vehicleId,
          ip_address: entry.ipAddress || null,
          user_agent: entry.userAgent || null,
          scanned_at: entry.scannedAt?.toISOString() || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create scan log', { error: error.message, entry });
        throw new Error(`Failed to create scan log: ${error.message}`);
      }

      const scanLog: ScanLog = {
        id: data.id,
        vehicleId: data.vehicle_id,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        scannedAt: new Date(data.scanned_at),
      };

      logger.info('Scan log created successfully', { id: scanLog.id });
      return scanLog;
    } catch (error: any) {
      logger.error('Error creating scan log', { error: error.message, entry });
      throw error;
    }
  }

  /**
   * Query scan logs with filtering and pagination
   */
  async queryScanLogs(filters: LogQueryFilters = {}): Promise<LogQueryResult<ScanLog>> {
    try {
      logger.info('Querying scan logs', { filters });

      let query = supabase
        .from('scan_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }

      if (filters.startDate) {
        query = query.gte('scanned_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('scanned_at', filters.endDate.toISOString());
      }

      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by scanned_at descending
      query = query.order('scanned_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to query scan logs', { error: error.message, filters });
        throw new Error(`Failed to query scan logs: ${error.message}`);
      }

      const scanLogs: ScanLog[] = (data || []).map(row => ({
        id: row.id,
        vehicleId: row.vehicle_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        scannedAt: new Date(row.scanned_at),
      }));

      const total = count || 0;
      const hasMore = offset + limit < total;

      logger.info('Scan logs queried successfully', {
        count: scanLogs.length,
        total,
        hasMore,
      });

      return { data: scanLogs, total, hasMore };
    } catch (error: any) {
      logger.error('Error querying scan logs', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * Get comprehensive logs for a vehicle (all types)
   */
  async getVehicleLogs(vehicleId: string, filters: Omit<LogQueryFilters, 'vehicleId'> = {}) {
    try {
      logger.info('Getting comprehensive vehicle logs', { vehicleId, filters });

      const [callLogs, alertLogs, scanLogs] = await Promise.all([
        this.queryCallLogs({ ...filters, vehicleId }),
        this.queryAlertLogs({ ...filters, vehicleId }),
        this.queryScanLogs({ ...filters, vehicleId }),
      ]);

      return {
        callLogs,
        alertLogs,
        scanLogs,
        summary: {
          totalCalls: callLogs.total,
          totalAlerts: alertLogs.total,
          totalScans: scanLogs.total,
        },
      };
    } catch (error: any) {
      logger.error('Error getting vehicle logs', { error: error.message, vehicleId, filters });
      throw error;
    }
  }

  /**
   * Mask phone number for logging privacy
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.length < 4) {
      return '****';
    }
    return '*'.repeat(phoneNumber.length - 4) + phoneNumber.slice(-4);
  }
}

// Export singleton instance
export const logService = new LogService();
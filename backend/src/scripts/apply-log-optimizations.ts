#!/usr/bin/env ts-node

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { supabase } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Apply log storage optimizations directly to the database
 */
async function applyLogOptimizations() {
  try {
    logger.info('Applying log storage and indexing optimizations...');

    // Composite indexes for better query performance on call_logs
    const optimizations = [
      // Call logs composite indexes
      `CREATE INDEX IF NOT EXISTS idx_call_logs_vehicle_status ON call_logs(vehicle_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_call_logs_vehicle_created ON call_logs(vehicle_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_call_logs_status_created ON call_logs(status, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_call_logs_vehicle_status_created ON call_logs(vehicle_id, status, created_at DESC)`,

      // Alert logs composite indexes
      `CREATE INDEX IF NOT EXISTS idx_alert_logs_vehicle_type ON alert_logs(vehicle_id, alert_type)`,
      `CREATE INDEX IF NOT EXISTS idx_alert_logs_vehicle_sent ON alert_logs(vehicle_id, sent_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_alert_logs_type_status ON alert_logs(alert_type, status)`,
      `CREATE INDEX IF NOT EXISTS idx_alert_logs_vehicle_type_sent ON alert_logs(vehicle_id, alert_type, sent_at DESC)`,

      // Scan logs composite indexes
      `CREATE INDEX IF NOT EXISTS idx_scan_logs_vehicle_scanned ON scan_logs(vehicle_id, scanned_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_scan_logs_ip_scanned ON scan_logs(ip_address, scanned_at DESC)`,

      // Partial indexes for active records
      `CREATE INDEX IF NOT EXISTS idx_call_logs_active_calls ON call_logs(vehicle_id, created_at DESC) 
       WHERE status IN ('initiated', 'ringing', 'answered')`,

      `CREATE INDEX IF NOT EXISTS idx_alert_logs_recent_alerts ON alert_logs(vehicle_id, sent_at DESC) 
       WHERE sent_at > NOW() - INTERVAL '30 days'`,

      `CREATE INDEX IF NOT EXISTS idx_scan_logs_recent_scans ON scan_logs(vehicle_id, scanned_at DESC) 
       WHERE scanned_at > NOW() - INTERVAL '30 days'`,
    ];

    // Execute each optimization
    for (const [index, sql] of optimizations.entries()) {
      try {
        logger.info(`Applying optimization ${index + 1}/${optimizations.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          logger.warn(`Optimization ${index + 1} warning`, { error: error.message, sql });
        } else {
          logger.info(`Optimization ${index + 1} applied successfully`);
        }
      } catch (error: any) {
        logger.error(`Failed to apply optimization ${index + 1}`, { error: error.message, sql });
      }
    }

    // Update table statistics
    logger.info('Updating table statistics for optimal query planning...');
    
    const analyzeQueries = [
      'ANALYZE call_logs',
      'ANALYZE alert_logs', 
      'ANALYZE scan_logs'
    ];

    for (const query of analyzeQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: query });
      if (error) {
        logger.warn('Failed to analyze table', { error: error.message, query });
      }
    }

    logger.info('Log storage optimizations completed successfully');
    
    // Get storage statistics
    try {
      const { data: callLogsCount } = await supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true });

      const { data: alertLogsCount } = await supabase
        .from('alert_logs')
        .select('*', { count: 'exact', head: true });

      const { data: scanLogsCount } = await supabase
        .from('scan_logs')
        .select('*', { count: 'exact', head: true });

      logger.info('Current log table statistics', {
        callLogs: callLogsCount?.length || 0,
        alertLogs: alertLogsCount?.length || 0,
        scanLogs: scanLogsCount?.length || 0,
      });
    } catch (error: any) {
      logger.warn('Could not retrieve table statistics', { error: error.message });
    }

  } catch (error: any) {
    logger.error('Failed to apply log optimizations', { error: error.message });
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  applyLogOptimizations()
    .then(() => {
      logger.info('Log optimization script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Log optimization script failed', { error: error.message });
      process.exit(1);
    });
}

export { applyLogOptimizations };
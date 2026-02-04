#!/usr/bin/env ts-node

import { supabase } from '../config/database';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface LogStorageStats {
  tableName: string;
  rowCount: number;
  tableSize: string;
  indexSize: string;
  totalSize: string;
}

interface RetentionConfig {
  callLogsRetentionDays: number;
  alertLogsRetentionDays: number;
  scanLogsRetentionDays: number;
}

class LogMaintenanceService {
  private retentionConfig: RetentionConfig;

  constructor() {
    this.retentionConfig = {
      callLogsRetentionDays: parseInt(process.env.CALL_LOGS_RETENTION_DAYS || '365'),
      alertLogsRetentionDays: parseInt(process.env.ALERT_LOGS_RETENTION_DAYS || '365'),
      scanLogsRetentionDays: parseInt(process.env.SCAN_LOGS_RETENTION_DAYS || '90'),
    };
  }

  /**
   * Apply database optimizations from SQL file
   */
  async applyOptimizations(): Promise<void> {
    try {
      logger.info('Applying log storage optimizations...');

      const sqlFilePath = path.join(__dirname, 'optimize-log-storage.sql');
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

      // Split SQL content by statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            logger.warn('SQL statement execution warning', { 
              error: error.message, 
              statement: statement.substring(0, 100) + '...' 
            });
          }
        }
      }

      logger.info('Log storage optimizations applied successfully');
    } catch (error: any) {
      logger.error('Failed to apply log storage optimizations', { error: error.message });
      throw error;
    }
  }

  /**
   * Clean up old log entries based on retention policy
   */
  async cleanupOldLogs(): Promise<void> {
    try {
      logger.info('Starting log cleanup process', { retentionConfig: this.retentionConfig });

      // Set retention configuration
      await this.setRetentionConfig();

      // Execute cleanup function
      const { data, error } = await supabase.rpc('cleanup_old_logs');

      if (error) {
        logger.error('Failed to cleanup old logs', { error: error.message });
        throw error;
      }

      logger.info('Log cleanup completed successfully', { result: data });
    } catch (error: any) {
      logger.error('Error during log cleanup', { error: error.message });
      throw error;
    }
  }

  /**
   * Get storage statistics for log tables
   */
  async getStorageStats(): Promise<LogStorageStats[]> {
    try {
      logger.info('Retrieving log storage statistics...');

      const { data, error } = await supabase.rpc('get_log_storage_stats');

      if (error) {
        logger.error('Failed to get storage statistics', { error: error.message });
        throw error;
      }

      const stats: LogStorageStats[] = data.map((row: any) => ({
        tableName: row.table_name,
        rowCount: parseInt(row.row_count),
        tableSize: row.table_size,
        indexSize: row.index_size,
        totalSize: row.total_size,
      }));

      logger.info('Storage statistics retrieved', { stats });
      return stats;
    } catch (error: any) {
      logger.error('Error retrieving storage statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze and update table statistics for better query performance
   */
  async analyzeQueryPerformance(): Promise<void> {
    try {
      logger.info('Analyzing log query performance...');

      const { error } = await supabase.rpc('analyze_log_query_performance');

      if (error) {
        logger.error('Failed to analyze query performance', { error: error.message });
        throw error;
      }

      logger.info('Query performance analysis completed');
    } catch (error: any) {
      logger.error('Error analyzing query performance', { error: error.message });
      throw error;
    }
  }

  /**
   * Get slow query statistics (if pg_stat_statements is available)
   */
  async getSlowQueries(): Promise<any[]> {
    try {
      logger.info('Retrieving slow query statistics...');

      const { data, error } = await supabase.rpc('get_slow_log_queries');

      if (error) {
        logger.warn('Could not retrieve slow queries (pg_stat_statements may not be available)', { 
          error: error.message 
        });
        return [];
      }

      logger.info('Slow query statistics retrieved', { queryCount: data?.length || 0 });
      return data || [];
    } catch (error: any) {
      logger.error('Error retrieving slow queries', { error: error.message });
      return [];
    }
  }

  /**
   * Run comprehensive maintenance routine
   */
  async runMaintenance(): Promise<{
    optimizationsApplied: boolean;
    cleanupCompleted: boolean;
    analysisCompleted: boolean;
    storageStats: LogStorageStats[];
    slowQueries: any[];
  }> {
    try {
      logger.info('Starting comprehensive log maintenance routine...');

      // Apply optimizations
      await this.applyOptimizations();
      const optimizationsApplied = true;

      // Clean up old logs
      await this.cleanupOldLogs();
      const cleanupCompleted = true;

      // Analyze performance
      await this.analyzeQueryPerformance();
      const analysisCompleted = true;

      // Get current statistics
      const storageStats = await this.getStorageStats();
      const slowQueries = await this.getSlowQueries();

      logger.info('Log maintenance routine completed successfully');

      return {
        optimizationsApplied,
        cleanupCompleted,
        analysisCompleted,
        storageStats,
        slowQueries,
      };
    } catch (error: any) {
      logger.error('Log maintenance routine failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Set retention configuration in database
   */
  private async setRetentionConfig(): Promise<void> {
    const configs = [
      { key: 'app.call_logs_retention_days', value: this.retentionConfig.callLogsRetentionDays.toString() },
      { key: 'app.alert_logs_retention_days', value: this.retentionConfig.alertLogsRetentionDays.toString() },
      { key: 'app.scan_logs_retention_days', value: this.retentionConfig.scanLogsRetentionDays.toString() },
    ];

    for (const config of configs) {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `SELECT set_config('${config.key}', '${config.value}', false)`
      });

      if (error) {
        logger.warn('Failed to set retention config', { key: config.key, error: error.message });
      }
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const maintenanceService = new LogMaintenanceService();

  try {
    switch (command) {
      case 'optimize':
        await maintenanceService.applyOptimizations();
        break;

      case 'cleanup':
        await maintenanceService.cleanupOldLogs();
        break;

      case 'stats':
        const stats = await maintenanceService.getStorageStats();
        console.table(stats);
        break;

      case 'analyze':
        await maintenanceService.analyzeQueryPerformance();
        break;

      case 'slow-queries':
        const slowQueries = await maintenanceService.getSlowQueries();
        console.table(slowQueries);
        break;

      case 'full':
      default:
        const result = await maintenanceService.runMaintenance();
        console.log('Maintenance Results:', JSON.stringify(result, null, 2));
        break;
    }

    logger.info('Log maintenance command completed successfully', { command });
    process.exit(0);
  } catch (error: any) {
    logger.error('Log maintenance command failed', { command, error: error.message });
    process.exit(1);
  }
}

// Export for use as module
export { LogMaintenanceService };

// Run CLI if called directly
if (require.main === module) {
  main();
}
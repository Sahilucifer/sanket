import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { supabase, testConnection } from '../config/database';
import { logger } from '../utils/logger';

async function main() {
  logger.info('Testing Supabase connection...');
  
  // Test basic connection
  const isConnected = await testConnection();
  
  if (!isConnected) {
    logger.error('Database connection failed');
    process.exit(1);
  }
  
  // Test table existence
  try {
    logger.info('Checking table existence...');
    
    const tables = ['users', 'vehicles', 'call_logs', 'alert_logs', 'scan_logs'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        logger.error(`Table ${table} check failed:`, error);
      } else {
        logger.info(`✅ Table ${table} exists and is accessible`);
      }
    }
    
    logger.info('✅ Database connection and table verification complete');
    
  } catch (error) {
    logger.error('Error during table verification:', error);
    process.exit(1);
  }
}

main().catch(console.error);
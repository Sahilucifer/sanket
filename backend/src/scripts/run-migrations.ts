#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { runMigrations } from '../utils/migration';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  try {
    logger.info('Starting migration process...');
    await runMigrations();
    logger.info('Migration process completed successfully');
  } catch (error) {
    logger.error('Migration process failed:', error);
    process.exit(1);
  }
}

// Run migrations if called directly
if (require.main === module) {
  main();
}

export { main as runMigrationsScript };
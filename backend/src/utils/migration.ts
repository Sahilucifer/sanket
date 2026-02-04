import fs from 'fs';
import path from 'path';
import { supabase } from '../config/database';
import { logger } from '../utils/logger';

// Create migrations table if it doesn't exist
const createMigrationsTable = async (): Promise<void> => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
  
  if (error) {
    logger.error('Error creating migrations table:', error);
    throw error;
  }
};

// Get executed migrations
const getExecutedMigrations = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('migrations')
    .select('id')
    .order('executed_at');

  if (error) {
    logger.error('Error fetching executed migrations:', error);
    return [];
  }

  return data?.map((m: { id: string }) => m.id) || [];
};

// Execute a migration
const executeMigration = async (migrationId: string, sql: string): Promise<void> => {
  // Execute the migration SQL
  const { error: execError } = await supabase.rpc('exec_sql', { sql });
  
  if (execError) {
    logger.error(`Error executing migration ${migrationId}:`, execError);
    throw execError;
  }

  // Record the migration as executed
  const { error: insertError } = await supabase
    .from('migrations')
    .insert({ id: migrationId, name: migrationId });

  if (insertError) {
    logger.error(`Error recording migration ${migrationId}:`, insertError);
    throw insertError;
  }

  logger.info(`Migration ${migrationId} executed successfully`);
};

// Run pending migrations
export const runMigrations = async (): Promise<void> => {
  try {
    logger.info('Starting database migrations...');

    // Create migrations table
    await createMigrationsTable();

    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();

    // Get migration files
    const migrationsDir = path.join(__dirname, '../../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      logger.warn('Migrations directory not found');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Execute pending migrations
    for (const file of migrationFiles) {
      const migrationId = path.basename(file, '.sql');
      
      if (executedMigrations.includes(migrationId)) {
        logger.info(`Migration ${migrationId} already executed, skipping`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await executeMigration(migrationId, sql);
    }

    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Error running migrations:', error);
    throw error;
  }
};

// Run seed data (for development)
export const runSeed = async (): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Seed data should not be run in production');
      return;
    }

    logger.info('Running seed data...');

    const seedPath = path.join(__dirname, '../../database/seed.sql');
    
    if (!fs.existsSync(seedPath)) {
      logger.warn('Seed file not found');
      return;
    }

    const sql = fs.readFileSync(seedPath, 'utf8');
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      logger.error('Error running seed data:', error);
      throw error;
    }

    logger.info('Seed data executed successfully');
  } catch (error) {
    logger.error('Error running seed data:', error);
    throw error;
  }
};
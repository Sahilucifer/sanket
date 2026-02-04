#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { supabase } from '../config/database';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  column_name: string;
}

interface IndexInfo {
  indexname: string;
  indexdef: string;
}

async function verifyUsersTableSchema(): Promise<void> {
  try {
    logger.info('Verifying users table schema...');

    // Check if users table exists and get its structure
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position;
      `
    }) as { data: ColumnInfo[] | null, error: any };

    if (columnsError) {
      logger.error('Error querying users table schema:', columnsError);
      return;
    }

    if (!columns || columns.length === 0) {
      logger.error('Users table not found or has no columns');
      return;
    }

    logger.info('Users table columns:');
    columns.forEach(col => {
      logger.info(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });

    // Verify required columns exist
    const columnNames = columns.map(col => col.column_name);
    const requiredColumns = ['id', 'name', 'phone', 'is_verified', 'created_at', 'updated_at'];
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    if (missingColumns.length > 0) {
      logger.error(`Missing required columns: ${missingColumns.join(', ')}`);
      return;
    }

    logger.info('✓ All required columns present');

    // Check unique constraint on phone
    const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'users' 
          AND tc.constraint_type = 'UNIQUE'
          AND kcu.column_name = 'phone';
      `
    }) as { data: ConstraintInfo[] | null, error: any };

    if (constraintsError) {
      logger.error('Error querying constraints:', constraintsError);
    } else if (!constraints || constraints.length === 0) {
      logger.error('✗ Missing unique constraint on phone field');
    } else {
      logger.info('✓ Unique constraint on phone field exists');
    }

    // Check indexes
    const { data: indexes, error: indexesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = 'users'
          AND indexname LIKE 'idx_%';
      `
    }) as { data: IndexInfo[] | null, error: any };

    if (indexesError) {
      logger.error('Error querying indexes:', indexesError);
    } else {
      logger.info('Users table indexes:');
      if (indexes && indexes.length > 0) {
        indexes.forEach(idx => {
          logger.info(`  - ${idx.indexname}`);
        });
        
        const indexNames = indexes.map(idx => idx.indexname);
        if (indexNames.includes('idx_users_phone')) {
          logger.info('✓ Phone index exists');
        } else {
          logger.error('✗ Missing phone index');
        }
        
        if (indexNames.includes('idx_users_verified')) {
          logger.info('✓ Verified index exists');
        } else {
          logger.error('✗ Missing verified index');
        }
      } else {
        logger.error('✗ No indexes found');
      }
    }

    // Check triggers
    const { data: triggers, error: triggersError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing
        FROM information_schema.triggers 
        WHERE event_object_table = 'users'
          AND trigger_name = 'update_users_updated_at';
      `
    });

    if (triggersError) {
      logger.error('Error querying triggers:', triggersError);
    } else if (!triggers || triggers.length === 0) {
      logger.error('✗ Missing updated_at trigger');
    } else {
      logger.info('✓ Updated_at trigger exists');
    }

    logger.info('Users table schema verification completed');

  } catch (error) {
    logger.error('Error verifying users table schema:', error);
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyUsersTableSchema()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Schema verification failed:', error);
      process.exit(1);
    });
}

export { verifyUsersTableSchema };
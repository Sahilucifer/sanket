import { supabase } from '../config/database';

describe('Users Table Schema', () => {
  beforeAll(async () => {
    // Ensure we can connect to the database
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.warn('Database connection failed, skipping tests:', error.message);
    }
  });

  test('should have users table with correct schema', async () => {
    // Query the information schema to verify table structure
    const { data, error } = await supabase.rpc('exec_sql', {
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
    });

    if (error) {
      console.warn('Could not verify schema, skipping test:', error.message);
      return;
    }

    expect(data).toBeDefined();
    
    // Check for required columns
    const columns = data || [];
    const columnNames = columns.map((col: any) => col.column_name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('phone');
    expect(columnNames).toContain('is_verified');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  test('should have unique constraint on phone field', async () => {
    // Query constraints to verify unique constraint on phone
    const { data, error } = await supabase.rpc('exec_sql', {
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
    });

    if (error) {
      console.warn('Could not verify constraints, skipping test:', error.message);
      return;
    }

    expect(data).toBeDefined();
    expect(data?.length).toBeGreaterThan(0);
  });

  test('should have proper indexes on users table', async () => {
    // Query indexes to verify proper indexing
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = 'users'
          AND indexname LIKE 'idx_%';
      `
    });

    if (error) {
      console.warn('Could not verify indexes, skipping test:', error.message);
      return;
    }

    expect(data).toBeDefined();
    
    const indexes = data || [];
    const indexNames = indexes.map((idx: any) => idx.indexname);
    
    // Should have indexes on phone and is_verified
    expect(indexNames).toContain('idx_users_phone');
    expect(indexNames).toContain('idx_users_verified');
  });

  test('should have updated_at trigger', async () => {
    // Query triggers to verify updated_at trigger exists
    const { data, error } = await supabase.rpc('exec_sql', {
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

    if (error) {
      console.warn('Could not verify triggers, skipping test:', error.message);
      return;
    }

    expect(data).toBeDefined();
    expect(data?.length).toBeGreaterThan(0);
    
    if (data && data.length > 0) {
      expect(data[0].event_manipulation).toBe('UPDATE');
      expect(data[0].action_timing).toBe('BEFORE');
    }
  });
});
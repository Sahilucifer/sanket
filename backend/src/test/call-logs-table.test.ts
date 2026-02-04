import fs from 'fs';
import path from 'path';

describe('Call Logs Table Schema Validation', () => {
  let schemaContent: string;
  let migrationContent: string;
  let rlsMigrationContent: string;

  beforeAll(() => {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    const rlsMigrationPath = path.join(__dirname, '../../migrations/002_row_level_security.sql');
    
    schemaContent = fs.readFileSync(schemaPath, 'utf8');
    migrationContent = fs.readFileSync(migrationPath, 'utf8');
    rlsMigrationContent = fs.readFileSync(rlsMigrationPath, 'utf8');
  });

  test('should have call_logs table creation statement', () => {
    const callLogsTableRegex = /CREATE TABLE.*call_logs\s*\(/i;
    expect(schemaContent).toMatch(callLogsTableRegex);
    expect(migrationContent).toMatch(callLogsTableRegex);
  });

  test('should have id field with UUID primary key', () => {
    const idFieldRegex = /id\s+UUID.*PRIMARY KEY.*DEFAULT.*uuid_generate_v4/i;
    expect(schemaContent).toMatch(idFieldRegex);
    expect(migrationContent).toMatch(idFieldRegex);
  });

  test('should have vehicle_id field with foreign key reference to vehicles table', () => {
    const vehicleIdFieldRegex = /vehicle_id\s+UUID.*NOT NULL.*REFERENCES\s+vehicles\(id\).*ON DELETE CASCADE/i;
    expect(schemaContent).toMatch(vehicleIdFieldRegex);
    expect(migrationContent).toMatch(vehicleIdFieldRegex);
  });

  test('should have caller_number field with VARCHAR(20) NOT NULL', () => {
    const callerNumberFieldRegex = /caller_number\s+VARCHAR\(20\).*NOT NULL/i;
    expect(schemaContent).toMatch(callerNumberFieldRegex);
    expect(migrationContent).toMatch(callerNumberFieldRegex);
  });

  test('should have owner_number field with VARCHAR(20) NOT NULL', () => {
    const ownerNumberFieldRegex = /owner_number\s+VARCHAR\(20\).*NOT NULL/i;
    expect(schemaContent).toMatch(ownerNumberFieldRegex);
    expect(migrationContent).toMatch(ownerNumberFieldRegex);
  });

  test('should have call_sid field with VARCHAR(255)', () => {
    const callSidFieldRegex = /call_sid\s+VARCHAR\(255\)/i;
    expect(schemaContent).toMatch(callSidFieldRegex);
    expect(migrationContent).toMatch(callSidFieldRegex);
  });

  test('should have status field with VARCHAR(50) NOT NULL and CHECK constraint', () => {
    const statusFieldRegex = /status\s+VARCHAR\(50\).*NOT NULL.*CHECK.*status\s+IN\s*\(.*'initiated'.*'ringing'.*'answered'.*'completed'.*'failed'.*'no-answer'.*\)/i;
    expect(schemaContent).toMatch(statusFieldRegex);
    expect(migrationContent).toMatch(statusFieldRegex);
  });

  test('should have duration field with INTEGER DEFAULT 0', () => {
    const durationFieldRegex = /duration\s+INTEGER.*DEFAULT\s+0/i;
    expect(schemaContent).toMatch(durationFieldRegex);
    expect(migrationContent).toMatch(durationFieldRegex);
  });

  test('should have timestamp fields for call tracking', () => {
    // started_at field
    const startedAtRegex = /started_at\s+TIMESTAMP WITH TIME ZONE/i;
    expect(schemaContent).toMatch(startedAtRegex);
    expect(migrationContent).toMatch(startedAtRegex);

    // ended_at field
    const endedAtRegex = /ended_at\s+TIMESTAMP WITH TIME ZONE/i;
    expect(schemaContent).toMatch(endedAtRegex);
    expect(migrationContent).toMatch(endedAtRegex);

    // created_at field with DEFAULT NOW()
    const createdAtRegex = /created_at\s+TIMESTAMP WITH TIME ZONE.*DEFAULT\s+NOW/i;
    expect(schemaContent).toMatch(createdAtRegex);
    expect(migrationContent).toMatch(createdAtRegex);
  });

  test('should have proper indexes for query optimization', () => {
    // Index on vehicle_id for foreign key queries
    const vehicleIdIndexRegex = /CREATE INDEX.*idx_call_logs_vehicle_id.*ON call_logs\(vehicle_id\)/i;
    expect(schemaContent).toMatch(vehicleIdIndexRegex);
    expect(migrationContent).toMatch(vehicleIdIndexRegex);

    // Index on caller_number for lookups
    const callerNumberIndexRegex = /CREATE INDEX.*idx_call_logs_caller_number.*ON call_logs\(caller_number\)/i;
    expect(schemaContent).toMatch(callerNumberIndexRegex);
    expect(migrationContent).toMatch(callerNumberIndexRegex);

    // Index on status for filtering by call status
    const statusIndexRegex = /CREATE INDEX.*idx_call_logs_status.*ON call_logs\(status\)/i;
    expect(schemaContent).toMatch(statusIndexRegex);
    expect(migrationContent).toMatch(statusIndexRegex);

    // Index on created_at for time-based queries
    const createdAtIndexRegex = /CREATE INDEX.*idx_call_logs_created_at.*ON call_logs\(created_at\)/i;
    expect(schemaContent).toMatch(createdAtIndexRegex);
    expect(migrationContent).toMatch(createdAtIndexRegex);
  });

  test('should have Row Level Security policies for call_logs', () => {
    // Check for RLS enablement
    const rlsRegex = /ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY/i;
    expect(schemaContent).toMatch(rlsRegex);
    expect(rlsMigrationContent).toMatch(rlsRegex);

    // Check for user access policies - users can view call logs for their own vehicles
    const userPolicyRegex = /CREATE POLICY.*call_logs.*vehicle_id IN.*SELECT id FROM vehicles WHERE user_id/i;
    expect(schemaContent).toMatch(userPolicyRegex);
    expect(rlsMigrationContent).toMatch(userPolicyRegex);

    // Check for service role policy
    const servicePolicyRegex = /CREATE POLICY.*Service role full access call_logs.*call_logs/i;
    expect(schemaContent).toMatch(servicePolicyRegex);
    expect(rlsMigrationContent).toMatch(servicePolicyRegex);
  });

  test('should validate foreign key relationship structure', () => {
    // Ensure the foreign key constraint is properly defined
    const foreignKeyRegex = /vehicle_id\s+UUID.*REFERENCES\s+vehicles\(id\)\s+ON DELETE CASCADE/i;
    expect(schemaContent).toMatch(foreignKeyRegex);
    expect(migrationContent).toMatch(foreignKeyRegex);
  });

  test('should validate status field constraints', () => {
    // Ensure all required status values are included in CHECK constraint
    const statusValues = ['initiated', 'ringing', 'answered', 'completed', 'failed', 'no-answer'];
    
    statusValues.forEach(status => {
      const statusRegex = new RegExp(`'${status}'`, 'i');
      expect(schemaContent).toMatch(statusRegex);
      expect(migrationContent).toMatch(statusRegex);
    });
  });

  test('should validate call tracking field requirements', () => {
    // Verify that all required fields for call tracking are present
    const requiredFields = [
      'caller_number',
      'owner_number', 
      'call_sid',
      'status',
      'duration',
      'started_at',
      'ended_at',
      'created_at'
    ];

    requiredFields.forEach(field => {
      const fieldRegex = new RegExp(`${field}\\s+`, 'i');
      expect(schemaContent).toMatch(fieldRegex);
      expect(migrationContent).toMatch(fieldRegex);
    });
  });
});
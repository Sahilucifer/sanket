import fs from 'fs';
import path from 'path';

describe('Vehicles Table Schema Validation', () => {
  let schemaContent: string;
  let migrationContent: string;

  beforeAll(() => {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    
    schemaContent = fs.readFileSync(schemaPath, 'utf8');
    migrationContent = fs.readFileSync(migrationPath, 'utf8');
  });

  test('should have vehicles table creation statement', () => {
    const vehiclesTableRegex = /CREATE TABLE.*vehicles\s*\(/i;
    expect(schemaContent).toMatch(vehiclesTableRegex);
    expect(migrationContent).toMatch(vehiclesTableRegex);
  });

  test('should have id field with UUID primary key', () => {
    const idFieldRegex = /id\s+UUID.*PRIMARY KEY.*DEFAULT.*uuid_generate_v4/i;
    expect(schemaContent).toMatch(idFieldRegex);
    expect(migrationContent).toMatch(idFieldRegex);
  });

  test('should have user_id field with foreign key reference to users table', () => {
    const userIdFieldRegex = /user_id\s+UUID.*NOT NULL.*REFERENCES\s+users\(id\).*ON DELETE CASCADE/i;
    expect(schemaContent).toMatch(userIdFieldRegex);
    expect(migrationContent).toMatch(userIdFieldRegex);
  });

  test('should have car_number field with VARCHAR(20) NOT NULL', () => {
    const carNumberFieldRegex = /car_number\s+VARCHAR\(20\).*NOT NULL/i;
    expect(schemaContent).toMatch(carNumberFieldRegex);
    expect(migrationContent).toMatch(carNumberFieldRegex);
  });

  test('should have qr_url field with TEXT type', () => {
    const qrUrlFieldRegex = /qr_url\s+TEXT/i;
    expect(schemaContent).toMatch(qrUrlFieldRegex);
    expect(migrationContent).toMatch(qrUrlFieldRegex);
  });

  test('should have is_active field with BOOLEAN DEFAULT TRUE', () => {
    const isActiveRegex = /is_active\s+BOOLEAN.*DEFAULT\s+TRUE/i;
    expect(schemaContent).toMatch(isActiveRegex);
    expect(migrationContent).toMatch(isActiveRegex);
  });

  test('should have created_at field with TIMESTAMP DEFAULT NOW()', () => {
    const createdAtRegex = /created_at\s+TIMESTAMP WITH TIME ZONE.*DEFAULT\s+NOW/i;
    expect(schemaContent).toMatch(createdAtRegex);
    expect(migrationContent).toMatch(createdAtRegex);
  });

  test('should have updated_at field with TIMESTAMP DEFAULT NOW()', () => {
    const updatedAtRegex = /updated_at\s+TIMESTAMP WITH TIME ZONE.*DEFAULT\s+NOW/i;
    expect(schemaContent).toMatch(updatedAtRegex);
    expect(migrationContent).toMatch(updatedAtRegex);
  });

  test('should have proper indexes for query optimization', () => {
    // Index on user_id for foreign key queries
    const userIdIndexRegex = /CREATE INDEX.*idx_vehicles_user_id.*ON vehicles\(user_id\)/i;
    expect(schemaContent).toMatch(userIdIndexRegex);
    expect(migrationContent).toMatch(userIdIndexRegex);

    // Index on car_number for lookups
    const carNumberIndexRegex = /CREATE INDEX.*idx_vehicles_car_number.*ON vehicles\(car_number\)/i;
    expect(schemaContent).toMatch(carNumberIndexRegex);
    expect(migrationContent).toMatch(carNumberIndexRegex);

    // Index on is_active for filtering active vehicles
    const isActiveIndexRegex = /CREATE INDEX.*idx_vehicles_active.*ON vehicles\(is_active\)/i;
    expect(schemaContent).toMatch(isActiveIndexRegex);
    expect(migrationContent).toMatch(isActiveIndexRegex);
  });

  test('should have updated_at trigger', () => {
    const triggerRegex = /CREATE TRIGGER.*update_vehicles_updated_at.*BEFORE UPDATE.*ON vehicles/i;
    expect(schemaContent).toMatch(triggerRegex);
    expect(migrationContent).toMatch(triggerRegex);
  });

  test('should have Row Level Security policies for vehicles', () => {
    // Check for RLS enablement
    const rlsRegex = /ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY/i;
    expect(schemaContent).toMatch(rlsRegex);

    // Check for user access policies
    const userPolicyRegex = /CREATE POLICY.*vehicles.*user_id/i;
    expect(schemaContent).toMatch(userPolicyRegex);

    // Check for public scanning policy
    const publicPolicyRegex = /CREATE POLICY.*Public can view active vehicles.*vehicles.*is_active = true/i;
    expect(schemaContent).toMatch(publicPolicyRegex);
  });

  test('should validate foreign key relationship structure', () => {
    // Ensure the foreign key constraint is properly defined
    const foreignKeyRegex = /user_id\s+UUID.*REFERENCES\s+users\(id\)\s+ON DELETE CASCADE/i;
    expect(schemaContent).toMatch(foreignKeyRegex);
    expect(migrationContent).toMatch(foreignKeyRegex);
  });
});
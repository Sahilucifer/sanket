import fs from 'fs';
import path from 'path';

describe('Users Table Schema Validation', () => {
  let schemaContent: string;
  let migrationContent: string;

  beforeAll(() => {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    
    schemaContent = fs.readFileSync(schemaPath, 'utf8');
    migrationContent = fs.readFileSync(migrationPath, 'utf8');
  });

  test('should have users table creation statement', () => {
    const usersTableRegex = /CREATE TABLE.*users\s*\(/i;
    expect(schemaContent).toMatch(usersTableRegex);
    expect(migrationContent).toMatch(usersTableRegex);
  });

  test('should have id field with UUID primary key', () => {
    const idFieldRegex = /id\s+UUID.*PRIMARY KEY.*DEFAULT.*uuid_generate_v4/i;
    expect(schemaContent).toMatch(idFieldRegex);
    expect(migrationContent).toMatch(idFieldRegex);
  });

  test('should have name field with VARCHAR(255) NOT NULL', () => {
    const nameFieldRegex = /name\s+VARCHAR\(255\).*NOT NULL/i;
    expect(schemaContent).toMatch(nameFieldRegex);
    expect(migrationContent).toMatch(nameFieldRegex);
  });

  test('should have phone field with VARCHAR(20) UNIQUE NOT NULL', () => {
    const phoneFieldRegex = /phone\s+VARCHAR\(20\).*UNIQUE.*NOT NULL/i;
    expect(schemaContent).toMatch(phoneFieldRegex);
    expect(migrationContent).toMatch(phoneFieldRegex);
  });

  test('should have is_verified field with BOOLEAN DEFAULT FALSE', () => {
    const isVerifiedRegex = /is_verified\s+BOOLEAN.*DEFAULT\s+FALSE/i;
    expect(schemaContent).toMatch(isVerifiedRegex);
    expect(migrationContent).toMatch(isVerifiedRegex);
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

  test('should have phone index', () => {
    const phoneIndexRegex = /CREATE INDEX.*idx_users_phone.*ON users\(phone\)/i;
    expect(schemaContent).toMatch(phoneIndexRegex);
    expect(migrationContent).toMatch(phoneIndexRegex);
  });

  test('should have is_verified index', () => {
    const verifiedIndexRegex = /CREATE INDEX.*idx_users_verified.*ON users\(is_verified\)/i;
    expect(schemaContent).toMatch(verifiedIndexRegex);
    expect(migrationContent).toMatch(verifiedIndexRegex);
  });

  test('should have updated_at trigger', () => {
    const triggerRegex = /CREATE TRIGGER.*update_users_updated_at.*BEFORE UPDATE.*ON users/i;
    expect(schemaContent).toMatch(triggerRegex);
    expect(migrationContent).toMatch(triggerRegex);
  });
});
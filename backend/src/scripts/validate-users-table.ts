#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

interface ValidationResult {
  passed: boolean;
  message: string;
}

function validateUsersTableSchema(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Read the schema file
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    results.push({
      passed: false,
      message: 'Schema file not found at database/schema.sql'
    });
    return results;
  }
  
  if (!fs.existsSync(migrationPath)) {
    results.push({
      passed: false,
      message: 'Initial migration file not found at migrations/001_initial_schema.sql'
    });
    return results;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  
  // Check for users table creation
  const usersTableRegex = /CREATE TABLE.*users\s*\(/i;
  if (schemaContent.match(usersTableRegex) && migrationContent.match(usersTableRegex)) {
    results.push({
      passed: true,
      message: '✓ Users table creation statement found in both schema and migration files'
    });
  } else {
    results.push({
      passed: false,
      message: '✗ Users table creation statement missing'
    });
  }
  
  // Check for required fields
  const requiredFields = [
    { field: 'id', pattern: /id\s+UUID.*PRIMARY KEY.*DEFAULT.*uuid_generate_v4/i },
    { field: 'name', pattern: /name\s+VARCHAR\(255\).*NOT NULL/i },
    { field: 'phone', pattern: /phone\s+VARCHAR\(20\).*UNIQUE.*NOT NULL/i },
    { field: 'is_verified', pattern: /is_verified\s+BOOLEAN.*DEFAULT\s+FALSE/i },
    { field: 'created_at', pattern: /created_at\s+TIMESTAMP WITH TIME ZONE.*DEFAULT\s+NOW/i },
    { field: 'updated_at', pattern: /updated_at\s+TIMESTAMP WITH TIME ZONE.*DEFAULT\s+NOW/i }
  ];
  
  requiredFields.forEach(({ field, pattern }) => {
    if (schemaContent.match(pattern) && migrationContent.match(pattern)) {
      results.push({
        passed: true,
        message: `✓ Field '${field}' properly defined with correct constraints`
      });
    } else {
      results.push({
        passed: false,
        message: `✗ Field '${field}' missing or incorrectly defined`
      });
    }
  });
  
  // Check for indexes
  const indexChecks = [
    { name: 'phone index', pattern: /CREATE INDEX.*idx_users_phone.*ON users\(phone\)/i },
    { name: 'verified index', pattern: /CREATE INDEX.*idx_users_verified.*ON users\(is_verified\)/i }
  ];
  
  indexChecks.forEach(({ name, pattern }) => {
    if (schemaContent.match(pattern) && migrationContent.match(pattern)) {
      results.push({
        passed: true,
        message: `✓ ${name} properly created`
      });
    } else {
      results.push({
        passed: false,
        message: `✗ ${name} missing`
      });
    }
  });
  
  // Check for updated_at trigger
  const triggerPattern = /CREATE TRIGGER.*update_users_updated_at.*BEFORE UPDATE.*ON users/i;
  if (schemaContent.match(triggerPattern) && migrationContent.match(triggerPattern)) {
    results.push({
      passed: true,
      message: '✓ Updated_at trigger properly created'
    });
  } else {
    results.push({
      passed: false,
      message: '✗ Updated_at trigger missing'
    });
  }
  
  return results;
}

function main(): void {
  console.log('Validating Users Table Schema Implementation...\n');
  
  const results = validateUsersTableSchema();
  let allPassed = true;
  
  results.forEach(result => {
    console.log(result.message);
    if (!result.passed) {
      allPassed = false;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('✅ All validations passed! Users table implementation is complete.');
    console.log('\nTask 2.1 Requirements Validation:');
    console.log('✓ Users table with id, name, phone, is_verified fields');
    console.log('✓ Unique constraints and indexes added');
    console.log('✓ Created_at and updated_at timestamps set up');
    console.log('✓ Requirements 8.1 satisfied');
  } else {
    console.log('❌ Some validations failed. Please review the implementation.');
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  main();
}

export { validateUsersTableSchema };
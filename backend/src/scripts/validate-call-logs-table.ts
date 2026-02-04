#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

interface ValidationResult {
  passed: boolean;
  message: string;
}

function validateCallLogsTableSchema(): ValidationResult[] {
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
  
  // Check for call_logs table creation
  const tableRegex = /CREATE TABLE.*call_logs\s*\(/i;
  if (schemaContent.match(tableRegex) && migrationContent.match(tableRegex)) {
    results.push({
      passed: true,
      message: '✓ Call logs table creation statement found in both schema and migration files'
    });
  } else {
    results.push({
      passed: false,
      message: '✗ Call logs table creation statement missing'
    });
  }
  
  // Check for required fields
  const requiredFields = [
    { field: 'id', pattern: /id\s+UUID.*PRIMARY KEY.*DEFAULT.*uuid_generate_v4/i },
    { field: 'vehicle_id', pattern: /vehicle_id\s+UUID.*NOT NULL.*REFERENCES vehicles\(id\).*ON DELETE CASCADE/i },
    { field: 'caller_number', pattern: /caller_number\s+VARCHAR\(20\).*NOT NULL/i },
    { field: 'owner_number', pattern: /owner_number\s+VARCHAR\(20\).*NOT NULL/i },
    { field: 'call_sid', pattern: /call_sid\s+VARCHAR\(255\)/i },
    { field: 'status', pattern: /status\s+VARCHAR\(50\).*NOT NULL.*CHECK.*status IN/i },
    { field: 'duration', pattern: /duration\s+INTEGER.*DEFAULT\s+0/i },
    { field: 'started_at', pattern: /started_at\s+TIMESTAMP WITH TIME ZONE/i },
    { field: 'ended_at', pattern: /ended_at\s+TIMESTAMP WITH TIME ZONE/i },
    { field: 'created_at', pattern: /created_at\s+TIMESTAMP WITH TIME ZONE.*DEFAULT\s+NOW/i }
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
    { name: 'vehicle_id index', pattern: /CREATE INDEX.*idx_call_logs_vehicle_id.*ON call_logs\(vehicle_id\)/i },
    { name: 'caller_number index', pattern: /CREATE INDEX.*idx_call_logs_caller_number.*ON call_logs\(caller_number\)/i },
    { name: 'status index', pattern: /CREATE INDEX.*idx_call_logs_status.*ON call_logs\(status\)/i },
    { name: 'created_at index', pattern: /CREATE INDEX.*idx_call_logs_created_at.*ON call_logs\(created_at\)/i }
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
  
  return results;
}

function main(): void {
  console.log('Validating Call Logs Table Schema Implementation...\n');
  
  const results = validateCallLogsTableSchema();
  let allPassed = true;
  
  results.forEach(result => {
    console.log(result.message);
    if (!result.passed) {
      allPassed = false;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('✅ All validations passed! Call logs table implementation is complete.');
    console.log('\nTask 2.3 Requirements Validation:');
    console.log('✓ Call logs table with vehicle_id, numbers, status, timestamp fields');
    console.log('✓ Foreign key constraint to vehicles table');
    console.log('✓ Indexes added for performance');
    console.log('✓ Requirements 8.3 satisfied');
  } else {
    console.log('❌ Some validations failed. Please review the implementation.');
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  main();
}

export { validateCallLogsTableSchema };
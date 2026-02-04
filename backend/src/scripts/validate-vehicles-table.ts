import fs from 'fs';
import path from 'path';

/**
 * Validates that the vehicles table implementation meets all requirements
 * Requirements 8.2: Vehicles table with user_id foreign key, car_number, qr_url, is_active fields
 */

function validateVehiclesTable(): boolean {
  console.log('🔍 Validating vehicles table implementation...');
  
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
  const rlsMigrationPath = path.join(__dirname, '../../migrations/002_row_level_security.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found:', schemaPath);
    return false;
  }
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    return false;
  }
  
  if (!fs.existsSync(rlsMigrationPath)) {
    console.error('❌ RLS Migration file not found:', rlsMigrationPath);
    return false;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const rlsMigrationContent = fs.readFileSync(rlsMigrationPath, 'utf8');
  
  const validations = [
    {
      name: 'Vehicles table creation',
      regex: /CREATE TABLE.*vehicles\s*\(/i,
      required: true,
      checkRls: false
    },
    {
      name: 'ID field with UUID primary key',
      regex: /id\s+UUID.*PRIMARY KEY.*DEFAULT.*uuid_generate_v4/i,
      required: true,
      checkRls: false
    },
    {
      name: 'user_id foreign key to users table',
      regex: /user_id\s+UUID.*NOT NULL.*REFERENCES\s+users\(id\).*ON DELETE CASCADE/i,
      required: true,
      checkRls: false
    },
    {
      name: 'car_number field with VARCHAR(20) NOT NULL',
      regex: /car_number\s+VARCHAR\(20\).*NOT NULL/i,
      required: true,
      checkRls: false
    },
    {
      name: 'qr_url field with TEXT type',
      regex: /qr_url\s+TEXT/i,
      required: true,
      checkRls: false
    },
    {
      name: 'is_active field with BOOLEAN DEFAULT TRUE',
      regex: /is_active\s+BOOLEAN.*DEFAULT\s+TRUE/i,
      required: true,
      checkRls: false
    },
    {
      name: 'created_at timestamp field',
      regex: /created_at\s+TIMESTAMP WITH TIME ZONE.*DEFAULT\s+NOW/i,
      required: true,
      checkRls: false
    },
    {
      name: 'updated_at timestamp field',
      regex: /updated_at\s+TIMESTAMP WITH TIME ZONE.*DEFAULT\s+NOW/i,
      required: true,
      checkRls: false
    },
    {
      name: 'Index on user_id',
      regex: /CREATE INDEX.*idx_vehicles_user_id.*ON vehicles\(user_id\)/i,
      required: true,
      checkRls: false
    },
    {
      name: 'Index on car_number',
      regex: /CREATE INDEX.*idx_vehicles_car_number.*ON vehicles\(car_number\)/i,
      required: true,
      checkRls: false
    },
    {
      name: 'Index on is_active',
      regex: /CREATE INDEX.*idx_vehicles_active.*ON vehicles\(is_active\)/i,
      required: true,
      checkRls: false
    },
    {
      name: 'Updated_at trigger',
      regex: /CREATE TRIGGER.*update_vehicles_updated_at.*BEFORE UPDATE.*ON vehicles/i,
      required: true,
      checkRls: false
    },
    {
      name: 'Row Level Security enabled',
      regex: /ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY/i,
      required: true,
      checkRls: true
    }
  ];
  
  let allValid = true;
  
  for (const validation of validations) {
    const schemaMatch = schemaContent.match(validation.regex);
    
    let migrationMatch;
    if (validation.checkRls) {
      // Check RLS in both schema and RLS migration file
      migrationMatch = rlsMigrationContent.match(validation.regex);
    } else {
      // Check in main migration file
      migrationMatch = migrationContent.match(validation.regex);
    }
    
    if (validation.required && (!schemaMatch || !migrationMatch)) {
      console.error(`❌ ${validation.name}: Missing in ${!schemaMatch ? 'schema' : 'migration'} file`);
      allValid = false;
    } else {
      console.log(`✅ ${validation.name}: Found in both files`);
    }
  }
  
  // Additional validation for RLS policies
  const vehiclePolicyRegex = /CREATE POLICY.*vehicles/i;
  const schemaHasPolicies = schemaContent.match(vehiclePolicyRegex);
  const rlsHasPolicies = rlsMigrationContent.match(vehiclePolicyRegex);
  
  if (!schemaHasPolicies || !rlsHasPolicies) {
    console.error('❌ Row Level Security policies for vehicles: Missing');
    allValid = false;
  } else {
    console.log('✅ Row Level Security policies for vehicles: Found');
  }
  
  return allValid;
}

function main() {
  console.log('='.repeat(60));
  console.log('VEHICLES TABLE VALIDATION');
  console.log('='.repeat(60));
  
  const isValid = validateVehiclesTable();
  
  console.log('='.repeat(60));
  if (isValid) {
    console.log('🎉 All validations passed! Vehicles table implementation is complete.');
    console.log('✅ Task 2.2: Create vehicles table with foreign key relationships - COMPLETED');
  } else {
    console.log('❌ Some validations failed. Please check the implementation.');
    process.exit(1);
  }
  console.log('='.repeat(60));
}

if (require.main === module) {
  main();
}

export { validateVehiclesTable };
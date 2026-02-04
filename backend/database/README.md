# Database Setup Guide

This guide explains how to set up the Supabase database for the Masked Calling Parking Alert System.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new Supabase project
3. Get your project URL and API keys

## Environment Variables

Copy the `.env.example` file to `.env` and fill in your Supabase credentials:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Schema

The database schema is defined in the following files:

- `schema.sql` - Complete database schema with all tables, indexes, and policies
- `migrations/001_initial_schema.sql` - Initial schema migration
- `migrations/002_row_level_security.sql` - Row Level Security policies
- `seed.sql` - Sample data for development (optional)

## Setup Instructions

### Option 1: Manual Setup (Recommended for Production)

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Run the contents of `schema.sql` to create all tables and policies

### Option 2: Using Supabase CLI (Recommended for Development)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project:
   ```bash
   supabase init
   ```

3. Link to your remote project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Push the schema:
   ```bash
   supabase db push
   ```

### Option 3: Using Migration Runner (Development)

The backend includes a migration runner that can execute migrations programmatically:

```typescript
import { runMigrations, runSeed } from '@/utils/migration';

// Run migrations
await runMigrations();

// Run seed data (development only)
await runSeed();
```

## Database Tables

### users
- Stores user account information
- Fields: id, name, phone, is_verified, created_at, updated_at

### vehicles
- Stores vehicle registration information
- Fields: id, user_id, car_number, qr_url, is_active, created_at, updated_at

### call_logs
- Stores call history and metadata
- Fields: id, vehicle_id, caller_number, owner_number, call_sid, status, duration, started_at, ended_at, created_at

### alert_logs
- Stores emergency alert history
- Fields: id, vehicle_id, alert_type, message, status, sent_at, created_at

### scan_logs
- Stores QR code scan history
- Fields: id, vehicle_id, ip_address, user_agent, scanned_at

## Storage Configuration

The system uses Supabase Storage for QR code images:

1. A `qr-codes` bucket is automatically created
2. QR code images are stored as `{vehicle_id}.png`
3. Images are publicly accessible for scanning

## Row Level Security (RLS)

The database uses Row Level Security to ensure data privacy:

- Users can only access their own data
- Public access is allowed for vehicle scanning
- Service role has full access for API operations

## Indexes

The schema includes optimized indexes for:
- User phone number lookups
- Vehicle queries by user and car number
- Call and alert log queries by vehicle and date
- Scan log queries by vehicle and timestamp

## Backup and Recovery

For production deployments:

1. Enable automated backups in Supabase dashboard
2. Set up point-in-time recovery
3. Consider setting up database replicas for high availability

## Troubleshooting

### Connection Issues
- Verify environment variables are correct
- Check Supabase project status
- Ensure IP allowlisting is configured (if enabled)

### Permission Issues
- Verify RLS policies are correctly configured
- Check service role key permissions
- Ensure API keys have necessary permissions

### Migration Issues
- Check migration files for syntax errors
- Verify migrations table exists
- Review Supabase logs for detailed error messages
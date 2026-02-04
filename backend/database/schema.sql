-- Masked Calling Parking Alert System Database Schema
-- This file contains the complete database schema for the system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_number VARCHAR(20) NOT NULL,
  qr_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_car_number ON vehicles(car_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(is_active);

-- Call logs table
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  caller_number VARCHAR(20) NOT NULL,
  owner_number VARCHAR(20) NOT NULL,
  call_sid VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('initiated', 'ringing', 'answered', 'completed', 'failed', 'no-answer')),
  duration INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for call logs
CREATE INDEX IF NOT EXISTS idx_call_logs_vehicle_id ON call_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller_number ON call_logs(caller_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at);

-- Alert logs table
CREATE TABLE IF NOT EXISTS alert_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('emergency_call', 'emergency_sms')),
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for alert logs
CREATE INDEX IF NOT EXISTS idx_alert_logs_vehicle_id ON alert_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_type ON alert_logs(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_logs_status ON alert_logs(status);
CREATE INDEX IF NOT EXISTS idx_alert_logs_sent_at ON alert_logs(sent_at);

-- Scan logs table
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scan logs
CREATE INDEX IF NOT EXISTS idx_scan_logs_vehicle_id ON scan_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scanned_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Vehicles policies
CREATE POLICY "Users can view own vehicles" ON vehicles
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own vehicles" ON vehicles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own vehicles" ON vehicles
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own vehicles" ON vehicles
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Public access for vehicle scanning (no auth required)
CREATE POLICY "Public can view active vehicles for scanning" ON vehicles
    FOR SELECT USING (is_active = true);

-- Call logs policies
CREATE POLICY "Users can view call logs for own vehicles" ON call_logs
    FOR SELECT USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id::text = auth.uid()::text
        )
    );

-- Alert logs policies  
CREATE POLICY "Users can view alert logs for own vehicles" ON alert_logs
    FOR SELECT USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id::text = auth.uid()::text
        )
    );

-- Scan logs policies
CREATE POLICY "Users can view scan logs for own vehicles" ON scan_logs
    FOR SELECT USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id::text = auth.uid()::text
        )
    );

-- Service role can access all data (for API operations)
CREATE POLICY "Service role full access users" ON users
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role full access vehicles" ON vehicles
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role full access call_logs" ON call_logs
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role full access alert_logs" ON alert_logs
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role full access scan_logs" ON scan_logs
    FOR ALL USING (current_setting('role') = 'service_role');
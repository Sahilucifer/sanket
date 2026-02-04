-- Migration: 001_initial_schema
-- Description: Create initial database schema for Masked Calling Parking Alert System
-- Date: 2026-02-02

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on phone for faster lookups
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_verified ON users(is_verified);

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_number VARCHAR(20) NOT NULL,
  qr_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vehicles
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_car_number ON vehicles(car_number);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

-- Call logs table
CREATE TABLE call_logs (
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
CREATE INDEX idx_call_logs_vehicle_id ON call_logs(vehicle_id);
CREATE INDEX idx_call_logs_caller_number ON call_logs(caller_number);
CREATE INDEX idx_call_logs_status ON call_logs(status);
CREATE INDEX idx_call_logs_created_at ON call_logs(created_at);

-- Alert logs table
CREATE TABLE alert_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('emergency_call', 'emergency_sms')),
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for alert logs
CREATE INDEX idx_alert_logs_vehicle_id ON alert_logs(vehicle_id);
CREATE INDEX idx_alert_logs_type ON alert_logs(alert_type);
CREATE INDEX idx_alert_logs_status ON alert_logs(status);
CREATE INDEX idx_alert_logs_sent_at ON alert_logs(sent_at);

-- Scan logs table
CREATE TABLE scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scan logs
CREATE INDEX idx_scan_logs_vehicle_id ON scan_logs(vehicle_id);
CREATE INDEX idx_scan_logs_scanned_at ON scan_logs(scanned_at);

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
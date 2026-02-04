-- Migration: 002_row_level_security
-- Description: Enable Row Level Security and create policies
-- Date: 2026-02-02

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Users policies - Users can only access their own data
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

-- Service role policies - Service role can access all data (for API operations)
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
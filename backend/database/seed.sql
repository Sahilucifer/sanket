-- Seed data for development and testing
-- This file contains sample data for development and testing purposes

-- Insert sample users (for development only)
INSERT INTO users (id, name, phone, is_verified) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'John Doe', '+1234567890', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', '+1234567891', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Bob Johnson', '+1234567892', false)
ON CONFLICT (phone) DO NOTHING;

-- Insert sample vehicles
INSERT INTO vehicles (id, user_id, car_number, qr_url, is_active) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'ABC123', 'https://example.com/qr/660e8400-e29b-41d4-a716-446655440001.png', true),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'XYZ789', 'https://example.com/qr/660e8400-e29b-41d4-a716-446655440002.png', true),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'DEF456', 'https://example.com/qr/660e8400-e29b-41d4-a716-446655440003.png', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample call logs
INSERT INTO call_logs (vehicle_id, caller_number, owner_number, status, duration) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '+1987654321', '+1234567890', 'completed', 120),
  ('660e8400-e29b-41d4-a716-446655440002', '+1987654322', '+1234567890', 'no-answer', 0),
  ('660e8400-e29b-41d4-a716-446655440003', '+1987654323', '+1234567891', 'completed', 85);

-- Insert sample alert logs
INSERT INTO alert_logs (vehicle_id, alert_type, message, status) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'emergency_call', 'Emergency alert: Your vehicle is blocking access', 'sent'),
  ('660e8400-e29b-41d4-a716-446655440002', 'emergency_sms', 'Emergency alert: Your vehicle needs immediate attention', 'delivered');

-- Insert sample scan logs
INSERT INTO scan_logs (vehicle_id, ip_address, user_agent) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '192.168.1.100', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'),
  ('660e8400-e29b-41d4-a716-446655440002', '192.168.1.101', 'Mozilla/5.0 (Android 11; Mobile)'),
  ('660e8400-e29b-41d4-a716-446655440003', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
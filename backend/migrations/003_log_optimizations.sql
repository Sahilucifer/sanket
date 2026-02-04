-- Log Storage and Indexing Optimization Migration
-- This migration adds composite indexes and optimization functions for log tables

-- Composite indexes for better query performance on call_logs
CREATE INDEX IF NOT EXISTS idx_call_logs_vehicle_status ON call_logs(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_call_logs_vehicle_created ON call_logs(vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_status_created ON call_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_vehicle_status_created ON call_logs(vehicle_id, status, created_at DESC);

-- Composite indexes for better query performance on alert_logs
CREATE INDEX IF NOT EXISTS idx_alert_logs_vehicle_type ON alert_logs(vehicle_id, alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_logs_vehicle_sent ON alert_logs(vehicle_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_logs_type_status ON alert_logs(alert_type, status);
CREATE INDEX IF NOT EXISTS idx_alert_logs_vehicle_type_sent ON alert_logs(vehicle_id, alert_type, sent_at DESC);

-- Composite indexes for better query performance on scan_logs
CREATE INDEX IF NOT EXISTS idx_scan_logs_vehicle_scanned ON scan_logs(vehicle_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_logs_ip_scanned ON scan_logs(ip_address, scanned_at DESC);

-- Partial indexes for active records (better performance for common queries)
CREATE INDEX IF NOT EXISTS idx_call_logs_active_calls ON call_logs(vehicle_id, created_at DESC) 
  WHERE status IN ('initiated', 'ringing', 'answered');

CREATE INDEX IF NOT EXISTS idx_alert_logs_recent_alerts ON alert_logs(vehicle_id, sent_at DESC) 
  WHERE sent_at > NOW() - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_scan_logs_recent_scans ON scan_logs(vehicle_id, scanned_at DESC) 
  WHERE scanned_at > NOW() - INTERVAL '30 days';

-- Function to clean up old log entries (log retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_logs(
  call_retention_days INTEGER DEFAULT 365,
  alert_retention_days INTEGER DEFAULT 365,
  scan_retention_days INTEGER DEFAULT 90
)
RETURNS TABLE(
  table_name TEXT,
  deleted_count BIGINT
) AS $$
DECLARE
  call_deleted BIGINT;
  alert_deleted BIGINT;
  scan_deleted BIGINT;
BEGIN
  -- Clean up old call logs
  DELETE FROM call_logs 
  WHERE created_at < NOW() - (call_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS call_deleted = ROW_COUNT;

  -- Clean up old alert logs
  DELETE FROM alert_logs 
  WHERE created_at < NOW() - (alert_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS alert_deleted = ROW_COUNT;

  -- Clean up old scan logs
  DELETE FROM scan_logs 
  WHERE scanned_at < NOW() - (scan_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS scan_deleted = ROW_COUNT;

  -- Update table statistics after cleanup
  ANALYZE call_logs;
  ANALYZE alert_logs;
  ANALYZE scan_logs;

  -- Return results
  RETURN QUERY VALUES 
    ('call_logs', call_deleted),
    ('alert_logs', alert_deleted),
    ('scan_logs', scan_deleted);
END;
$$ LANGUAGE plpgsql;

-- Function to get log storage statistics
CREATE OR REPLACE FUNCTION get_log_storage_stats()
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'call_logs'::TEXT,
    (SELECT COUNT(*) FROM call_logs),
    pg_size_pretty(pg_total_relation_size('call_logs') - pg_indexes_size('call_logs')),
    pg_size_pretty(pg_indexes_size('call_logs')),
    pg_size_pretty(pg_total_relation_size('call_logs'))
  UNION ALL
  SELECT 
    'alert_logs'::TEXT,
    (SELECT COUNT(*) FROM alert_logs),
    pg_size_pretty(pg_total_relation_size('alert_logs') - pg_indexes_size('alert_logs')),
    pg_size_pretty(pg_indexes_size('alert_logs')),
    pg_size_pretty(pg_total_relation_size('alert_logs'))
  UNION ALL
  SELECT 
    'scan_logs'::TEXT,
    (SELECT COUNT(*) FROM scan_logs),
    pg_size_pretty(pg_total_relation_size('scan_logs') - pg_indexes_size('scan_logs')),
    pg_size_pretty(pg_indexes_size('scan_logs')),
    pg_size_pretty(pg_total_relation_size('scan_logs'));
END;
$$ LANGUAGE plpgsql;

-- Create a view for recent log activity (commonly queried data)
CREATE OR REPLACE VIEW recent_log_activity AS
SELECT 
  'call' as log_type,
  vehicle_id,
  created_at as timestamp,
  status,
  NULL as alert_type,
  NULL as ip_address
FROM call_logs 
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'alert' as log_type,
  vehicle_id,
  created_at as timestamp,
  status,
  alert_type,
  NULL as ip_address
FROM alert_logs 
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'scan' as log_type,
  vehicle_id,
  scanned_at as timestamp,
  NULL as status,
  NULL as alert_type,
  host(ip_address) as ip_address
FROM scan_logs 
WHERE scanned_at > NOW() - INTERVAL '7 days'

ORDER BY timestamp DESC;

-- Create index on the view's underlying query pattern
CREATE INDEX IF NOT EXISTS idx_call_logs_recent_activity ON call_logs(created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_alert_logs_recent_activity ON alert_logs(created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_scan_logs_recent_activity ON scan_logs(scanned_at DESC) 
  WHERE scanned_at > NOW() - INTERVAL '7 days';
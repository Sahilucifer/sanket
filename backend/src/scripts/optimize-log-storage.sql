-- Log Storage and Indexing Optimization Script
-- This script adds composite indexes and implements log retention policies

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
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
DECLARE
  call_logs_retention_days INTEGER := COALESCE(current_setting('app.call_logs_retention_days', true)::INTEGER, 365);
  alert_logs_retention_days INTEGER := COALESCE(current_setting('app.alert_logs_retention_days', true)::INTEGER, 365);
  scan_logs_retention_days INTEGER := COALESCE(current_setting('app.scan_logs_retention_days', true)::INTEGER, 90);
  deleted_count INTEGER;
BEGIN
  -- Clean up old call logs
  DELETE FROM call_logs 
  WHERE created_at < NOW() - (call_logs_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % old call log entries (older than % days)', deleted_count, call_logs_retention_days;

  -- Clean up old alert logs
  DELETE FROM alert_logs 
  WHERE created_at < NOW() - (alert_logs_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % old alert log entries (older than % days)', deleted_count, alert_logs_retention_days;

  -- Clean up old scan logs
  DELETE FROM scan_logs 
  WHERE scanned_at < NOW() - (scan_logs_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % old scan log entries (older than % days)', deleted_count, scan_logs_retention_days;

  -- Update table statistics after cleanup
  ANALYZE call_logs;
  ANALYZE alert_logs;
  ANALYZE scan_logs;
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

-- Function to analyze query performance for log tables
CREATE OR REPLACE FUNCTION analyze_log_query_performance()
RETURNS void AS $$
BEGIN
  -- Update table statistics for better query planning
  ANALYZE call_logs;
  ANALYZE alert_logs;
  ANALYZE scan_logs;
  
  RAISE NOTICE 'Log table statistics updated for optimal query performance';
END;
$$ LANGUAGE plpgsql;

-- Set default retention periods (can be overridden with environment variables)
-- These settings can be modified based on storage requirements and compliance needs
SELECT set_config('app.call_logs_retention_days', '365', false);  -- 1 year
SELECT set_config('app.alert_logs_retention_days', '365', false); -- 1 year  
SELECT set_config('app.scan_logs_retention_days', '90', false);   -- 3 months

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

-- Performance monitoring: Create a function to identify slow log queries
CREATE OR REPLACE FUNCTION get_slow_log_queries()
RETURNS TABLE(
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  rows BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_stat_statements.query,
    pg_stat_statements.calls,
    pg_stat_statements.total_exec_time,
    pg_stat_statements.mean_exec_time,
    pg_stat_statements.rows
  FROM pg_stat_statements 
  WHERE pg_stat_statements.query ILIKE '%call_logs%' 
     OR pg_stat_statements.query ILIKE '%alert_logs%' 
     OR pg_stat_statements.query ILIKE '%scan_logs%'
  ORDER BY pg_stat_statements.mean_exec_time DESC
  LIMIT 10;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'pg_stat_statements extension not available. Install it for query performance monitoring.';
    RETURN;
END;
$$ LANGUAGE plpgsql;
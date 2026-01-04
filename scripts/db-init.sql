-- Villa Database Initialization
-- This script runs automatically when PostgreSQL container first starts
-- It sets up extensions and default permissions

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create read-only user for monitoring/analytics (optional)
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'villa_readonly') THEN
--     CREATE ROLE villa_readonly WITH LOGIN PASSWORD 'readonly_password';
--   END IF;
-- END
-- $$;

-- Grant read permissions (uncomment if using readonly user)
-- GRANT CONNECT ON DATABASE villa_dev TO villa_readonly;
-- GRANT USAGE ON SCHEMA public TO villa_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO villa_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO villa_readonly;

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'Villa database initialized successfully';
END
$$;

-- CaddyAI Database initialization script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database user if not exists (handled by Docker environment)
-- This script runs as part of Docker initialization

-- Create indexes for better performance (migrations will create tables)
-- These will be created after migrations run

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE caddyai_db TO caddyai_user;

-- Set timezone
SET timezone TO 'UTC';
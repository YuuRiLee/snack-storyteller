-- Database initialization script for Snack Storyteller
-- This runs automatically when the PostgreSQL container is first created

-- Enable pgvector extension (for semantic memory - Phase 5)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create development database (if not exists)
SELECT 'CREATE DATABASE snack_storyteller_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'snack_storyteller_dev')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE snack_storyteller_dev TO postgres;

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'Database initialized successfully!';
  RAISE NOTICE 'pgvector extension enabled for AI semantic memory';
END $$;

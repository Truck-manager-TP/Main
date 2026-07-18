-- Runs once when the data directory is first created.
-- Schema objects are owned by Flyway migrations, not this script.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

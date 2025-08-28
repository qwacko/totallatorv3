-- Custom SQL migration file, put your code below! --

-- Refresh collation version to resolve PostgreSQL collation version mismatch warnings
-- This fixes the warning: "database has a collation version mismatch"
-- which commonly occurs when running in Docker containers with different glibc versions
DO $$
BEGIN
    EXECUTE 'ALTER DATABASE ' || current_database() || ' REFRESH COLLATION VERSION';
END $$;
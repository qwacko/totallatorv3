CREATE EXTENSION IF NOT EXISTS pg_trgm; --> statement-breakpoint 
CREATE INDEX IF NOT EXISTS "materialized_import_check_view_desc_search" ON "import_check_materialized_view" USING gist(description gist_trgm_ops); --> statement-breakpoint 

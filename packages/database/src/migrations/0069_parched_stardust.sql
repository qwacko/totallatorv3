-- Add missing unique index for journal_extended_view materialized view
-- This enables progressive updates to work correctly
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_journal_view_index" ON "journal_extended_view" ("id");
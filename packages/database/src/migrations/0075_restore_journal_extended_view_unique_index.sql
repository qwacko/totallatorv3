CREATE UNIQUE INDEX IF NOT EXISTS "materialized_journal_view_index"
	ON "public"."journal_extended_view" ("id");

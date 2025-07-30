CREATE UNIQUE INDEX IF NOT EXISTS "materialized_journal_view_index" ON "journal_extended_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_account_view_index" ON "account_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_bill_view_index" ON "bill_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_budget_view_index" ON "budget_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_category_view_index" ON "category_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_tag_view_index" ON "tag_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_label_view_index" ON "label_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_import_check_view_index" ON "import_check_materialized_view" ("id"); --> statement-breakpoint 
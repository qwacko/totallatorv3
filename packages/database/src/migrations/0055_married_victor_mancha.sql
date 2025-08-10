DROP INDEX IF EXISTS "materialized_import_check_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_import_check_description_index"; --> statement-breakpoint 
DROP MATERIALIZED VIEW IF EXISTS "import_check_materialized_view"; --> statement-breakpoint 
DROP VIEW "public"."import_check_view";--> statement-breakpoint
CREATE VIEW "public"."import_check_view" AS (select "id", "relation_id", "relation_2_id", processed_info->'dataToUse'->'description' as "description" from "import_item_detail" where (processed_info->'dataToUse'->'description' is not null and ("import_item_detail"."relation_id" is not null or "import_item_detail"."relation_2_id" is not null)));
CREATE MATERIALIZED VIEW "public"."import_check_materialized_view" AS (select "id", "relation_id", "relation_2_id", "description" from "import_check_view");--> statement-breakpoint

DROP INDEX IF EXISTS "materialized_journal_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_account_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_bill_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_budget_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_category_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_tag_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_label_view_index"; --> statement-breakpoint 

CREATE UNIQUE INDEX IF NOT EXISTS "materialized_journal_view_index" ON "journal_extended_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_account_view_index" ON "account_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_bill_view_index" ON "bill_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_budget_view_index" ON "budget_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_category_view_index" ON "category_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_tag_view_index" ON "tag_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_label_view_index" ON "label_materialized_view" ("id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_import_check_view_index" ON "import_check_materialized_view" ("id"); --> statement-breakpoint 
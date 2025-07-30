drop materialized view if exists "journal_extended_view"; --> statement-breakpoint
drop materialized view if exists "account_materialized_view"; --> statement-breakpoint
drop materialized view if exists "bill_materialized_view"; --> statement-breakpoint
drop materialized view if exists "budget_materialized_view"; --> statement-breakpoint
drop materialized view if exists "category_materialized_view"; --> statement-breakpoint
drop materialized view if exists "tag_materialized_view"; --> statement-breakpoint
drop materialized view if exists "label_materialized_view"; --> statement-breakpoint
DROP TABLE "summary";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN IF EXISTS "summary_id";--> statement-breakpoint
ALTER TABLE "bill" DROP COLUMN IF EXISTS "summary_id";--> statement-breakpoint
ALTER TABLE "budget" DROP COLUMN IF EXISTS "summary_id";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN IF EXISTS "summary_id";--> statement-breakpoint
ALTER TABLE "label" DROP COLUMN IF EXISTS "summary_id";--> statement-breakpoint
ALTER TABLE "tag" DROP COLUMN IF EXISTS "summary_id";
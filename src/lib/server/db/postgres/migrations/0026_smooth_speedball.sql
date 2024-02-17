DO $$ BEGIN
 CREATE TYPE "report_layout" AS ENUM('singleItem', 'twoItemsHorizontal', 'twoItemsVertical', 'twoLargeOneSmallVertical', 'twoLargeOneSmallHorizontal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "filters_to_report_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"report_element_config_id" text NOT NULL,
	"filter_id" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "filters_to_report_configs_report_element_config_id_filter_id_unique" UNIQUE("report_element_config_id","filter_id"),
	CONSTRAINT "filters_to_report_configs_report_element_config_id_order_unique" UNIQUE("report_element_config_id","order")
);
--> statement-breakpoint
DROP INDEX IF EXISTS "report_element_config_filter_idx";--> statement-breakpoint
ALTER TABLE "report_element" ALTER COLUMN "report_element_config_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "report_element_config" ADD COLUMN "layout" "report_layout" DEFAULT 'singleItem' NOT NULL;--> statement-breakpoint
ALTER TABLE "report_element_config" ADD COLUMN "config" jsonb;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_element_config__from_filter_idx" ON "filters_to_report_configs" ("report_element_config_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "filter_idx" ON "filters_to_report_configs" ("filter_id");--> statement-breakpoint
ALTER TABLE "report_element_config" DROP COLUMN IF EXISTS "filter_id";--> statement-breakpoint
ALTER TABLE "report_element_config" DROP COLUMN IF EXISTS "configuration";
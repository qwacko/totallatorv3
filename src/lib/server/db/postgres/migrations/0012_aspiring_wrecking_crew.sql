CREATE TABLE IF NOT EXISTS "single_filter" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"filter" text NOT NULL,
	"filter_text" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "filter_id" text;--> statement-breakpoint
ALTER TABLE "report_config" ADD COLUMN "filter_id" text;--> statement-breakpoint
ALTER TABLE "report_config_to_report" ADD COLUMN "filter_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "filter_filter_text_idx" ON "single_filter" ("filter_text");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_filter_idx" ON "report" ("filter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_config_filter_idx" ON "report_config" ("filter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report__config_to_report_filter_idx" ON "report_config_to_report" ("filter_id");--> statement-breakpoint
ALTER TABLE "report" DROP COLUMN IF EXISTS "filter";--> statement-breakpoint
ALTER TABLE "report" DROP COLUMN IF EXISTS "filter_text";--> statement-breakpoint
ALTER TABLE "report_config" DROP COLUMN IF EXISTS "filter";--> statement-breakpoint
ALTER TABLE "report_config" DROP COLUMN IF EXISTS "filter_text";--> statement-breakpoint
ALTER TABLE "report_config_to_report" DROP COLUMN IF EXISTS "filter";--> statement-breakpoint
ALTER TABLE "report_config_to_report" DROP COLUMN IF EXISTS "filter_text";
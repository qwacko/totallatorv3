CREATE TABLE IF NOT EXISTS "report_element" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text,
	"report_id" text NOT NULL,
	"rows" integer DEFAULT 0 NOT NULL,
	"cols" integer DEFAULT 0 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"report_element_config_id" text,
	"filter_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_element_config" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text NOT NULL,
	"group" text,
	"locked" boolean DEFAULT false NOT NULL,
	"reusable" boolean DEFAULT false NOT NULL,
	"filter_id" text,
	"configuration" text NOT NULL,
	"configuration_text" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "report_config";--> statement-breakpoint
DROP TABLE "report_config_to_report";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_element_config_idx" ON "report_element" ("report_element_config_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_idx" ON "report_element" ("report_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_element_filter_idx" ON "report_element" ("filter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_element_config_title_idx" ON "report_element_config" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_element_config_group_idx" ON "report_element_config" ("group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_element_config_reusable_idx" ON "report_element_config" ("reusable");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_element_config_title_group_idx" ON "report_element_config" ("title","group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_element_config_locked_idx" ON "report_element_config" ("locked");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_element_config_filter_idx" ON "report_element_config" ("filter_id");
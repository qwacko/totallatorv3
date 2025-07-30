CREATE TABLE IF NOT EXISTS "report" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text NOT NULL,
	"group" text,
	"locked" boolean DEFAULT false NOT NULL,
	"filter" text NOT NULL,
	"filter_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_config" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text NOT NULL,
	"group" text,
	"locked" boolean DEFAULT false NOT NULL,
	"reusable" boolean DEFAULT false NOT NULL,
	"filter" text NOT NULL,
	"filter_text" text NOT NULL,
	"configuration" text NOT NULL,
	"configuration_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_config_to_report" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text,
	"size" text DEFAULT 'medium' NOT NULL,
	"report_config_id" text NOT NULL,
	"report_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"filter" text NOT NULL,
	"filter_text" text NOT NULL,
	CONSTRAINT "report_config_to_report_report_config_id_report_id_unique" UNIQUE("report_config_id","report_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_title_idx" ON "report" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_group_idx" ON "report" ("group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_title_group_idx" ON "report" ("title","group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_locked_idx" ON "report" ("locked");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_config_title_idx" ON "report_config" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_config_group_idx" ON "report_config" ("group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_config_reusable_idx" ON "report_config" ("reusable");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_config_title_group_idx" ON "report_config" ("title","group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_config_locked_idx" ON "report_config" ("locked");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_config_idx" ON "report_config_to_report" ("report_config_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_idx" ON "report_config_to_report" ("report_id");
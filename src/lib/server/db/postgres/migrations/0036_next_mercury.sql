CREATE TABLE IF NOT EXISTS "auto_import" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"mapped_import_id" text NOT NULL,
	"frequency" text NOT NULL,
	"type" text NOT NULL,
	"last_transaction_date" timestamp,
	"config" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import" ADD COLUMN "auto_import_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auto_import_mapped_import_idx" ON "auto_import" ("mapped_import_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auto_import_frequency_idx" ON "auto_import" ("frequency");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auto_import_title_idx" ON "auto_import" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auto_import_type_idx" ON "auto_import" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "import_auto_import_idx" ON "import" ("auto_import_id");
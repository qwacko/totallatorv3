CREATE TABLE IF NOT EXISTS "files" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text,
	"reason" text NOT NULL,
	"original_filename" text NOT NULL,
	"filename" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"file_exists" boolean NOT NULL,
	"linked" boolean NOT NULL,
	"transaction_id" text,
	"account_id" text,
	"bill_id" text,
	"budget_id" text,
	"category_id" text,
	"tag_id" text,
	"label_id" text,
	"auto_import_id" text,
	"report_id" text,
	"report_element_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"note" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"created_by" text NOT NULL,
	"transaction_id" text,
	"account_id" text,
	"bill_id" text,
	"budget_id" text,
	"category_id" text,
	"tag_id" text,
	"label_id" text,
	"file_id" text,
	"auto_import_id" text,
	"report_id" text,
	"report_element_id" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_reason_idx" ON "files" ("reason");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_title_idx" ON "files" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_filename_idx" ON "files" ("filename");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_type_idx" ON "files" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_size_idx" ON "files" ("size");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_file_exists_idx" ON "files" ("file_exists");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_transaction_idx" ON "files" ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_account_idx" ON "files" ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_bill_idx" ON "files" ("bill_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_budget_idx" ON "files" ("budget_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_category_idx" ON "files" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_tag_idx" ON "files" ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_label_idx" ON "files" ("label_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_auto_import_idx" ON "files" ("auto_import_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_report_idx" ON "files" ("report_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_report_element_idx" ON "files" ("report_element_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_note_idx" ON "notes" ("note");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_type_idx" ON "notes" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_transaction_idx" ON "notes" ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_account_idx" ON "notes" ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_bill_idx" ON "notes" ("bill_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_budget_idx" ON "notes" ("budget_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_category_idx" ON "notes" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_tag_idx" ON "notes" ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_label_idx" ON "notes" ("label_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_created_by_idx" ON "notes" ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_file_idx" ON "notes" ("file_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_auto_import_idx" ON "notes" ("auto_import_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_report_idx" ON "notes" ("report_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_report_element_idx" ON "notes" ("report_element_id");
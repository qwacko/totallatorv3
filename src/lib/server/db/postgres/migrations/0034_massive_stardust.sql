CREATE TABLE IF NOT EXISTS "backup_table" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text NOT NULL,
	"filename" text NOT NULL,
	"file_exists" boolean NOT NULL,
	"version" integer NOT NULL,
	"restore_date" timestamp,
	"compressed" boolean NOT NULL,
	"creation_reason" text NOT NULL,
	"created_by" text NOT NULL,
	"information" jsonb NOT NULL,
	CONSTRAINT "backup_table_filename_unique" UNIQUE("filename")
);

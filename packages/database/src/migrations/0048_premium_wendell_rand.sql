CREATE TABLE IF NOT EXISTS "query_contents" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"query" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "query_log_title" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "query_log" ADD COLUMN "title_id" varchar(60);--> statement-breakpoint
ALTER TABLE "query_log" ADD COLUMN "query_id" varchar(60);
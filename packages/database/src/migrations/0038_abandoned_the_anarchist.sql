ALTER TABLE "auto_import" ADD COLUMN "auto_process" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "auto_import" ADD COLUMN "auto_clean" boolean DEFAULT false NOT NULL;
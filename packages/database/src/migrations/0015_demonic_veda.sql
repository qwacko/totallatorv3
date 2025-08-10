DO $$ BEGIN
 CREATE TYPE "report_size" AS ENUM('sm', 'lg', 'xs', 'xl');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "size" "report_size" DEFAULT 'xl' NOT NULL;
UPDATE "single_filter" SET "filter" = NULL;--> statement-breakpoint
ALTER TABLE "single_filter" ALTER COLUMN "filter" TYPE jsonb USING "filter"::jsonb;

ALTER TABLE "journal_entry" ALTER COLUMN "amount" SET DATA TYPE numeric(20, 4);--> statement-breakpoint
ALTER TABLE "summary" ALTER COLUMN "sum" SET DATA TYPE numeric(20, 4);--> statement-breakpoint
ALTER TABLE "summary" ALTER COLUMN "count" SET DATA TYPE numeric(20, 4);
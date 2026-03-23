ALTER TABLE "agent_run" ALTER COLUMN "started_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "agent_run" ALTER COLUMN "started_at" DROP NOT NULL;
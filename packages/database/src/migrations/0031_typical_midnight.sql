ALTER TABLE "user_session" ADD COLUMN "expires_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_session" DROP COLUMN IF EXISTS "active_expires";--> statement-breakpoint
ALTER TABLE "user_session" DROP COLUMN IF EXISTS "idle_expires";--> statement-breakpoint
ALTER TABLE "user_key" ADD CONSTRAINT "user_key_user_id_unique" UNIQUE("user_id");
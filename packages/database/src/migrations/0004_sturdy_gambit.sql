ALTER TABLE "user_key" ALTER COLUMN "user_id" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "user_key" ALTER COLUMN "hashed_password" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "user_session" ALTER COLUMN "user_id" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" SET DATA TYPE varchar(30);
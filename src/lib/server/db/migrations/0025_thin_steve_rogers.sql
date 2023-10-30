CREATE TABLE `summary` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL,
	`type` text NOT NULL,
	`needs_update` integer DEFAULT true NOT NULL,
	`relation_id` text NOT NULL,
	`sum` integer DEFAULT 0 NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`first_date` integer,
	`last_date` integer
);
--> statement-breakpoint
ALTER TABLE account ADD `summary_id` text;--> statement-breakpoint
ALTER TABLE bill ADD `summary_id` text;--> statement-breakpoint
ALTER TABLE budget ADD `summary_id` text;--> statement-breakpoint
ALTER TABLE category ADD `summary_id` text;--> statement-breakpoint
ALTER TABLE label ADD `summary_id` text;--> statement-breakpoint
ALTER TABLE tag ADD `summary_id` text;
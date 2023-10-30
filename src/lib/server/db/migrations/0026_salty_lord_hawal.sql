
DROP TABLE `summary`; --> statement-breakpoint

CREATE TABLE `summary` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL,
	`type` text NOT NULL,
	`needs_update` integer DEFAULT true NOT NULL,
	`relation_id` text NOT NULL,
	`sum` integer DEFAULT 0,
	`count` integer DEFAULT 0,
	`first_date` integer,
	`last_date` integer
);
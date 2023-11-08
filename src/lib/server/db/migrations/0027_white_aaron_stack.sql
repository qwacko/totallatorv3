CREATE TABLE `filter` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL,
	`title` text NOT NULL,
	`apply_automatically` integer DEFAULT false NOT NULL,
	`apply_following_import` integer DEFAULT false NOT NULL,
	`automatic_frequency` text,
	`listed` integer DEFAULT true NOT NULL,
	`modifier` integer DEFAULT false NOT NULL,
	`filter` text NOT NULL,
	`filter_text` text NOT NULL,
	`change` text,
	`change_text` text
);

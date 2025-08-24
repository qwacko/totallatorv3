CREATE TABLE `configuration` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`destination` text NOT NULL,
	`domain` text NOT NULL,
	`action` text NOT NULL,
	`log_level` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `config_destination_idx` ON `configuration` (`destination`);--> statement-breakpoint
CREATE INDEX `config_domain_action_idx` ON `configuration` (`domain`,`action`);--> statement-breakpoint
CREATE INDEX `config_unique_idx` ON `configuration` (`destination`,`domain`,`action`);--> statement-breakpoint
CREATE TABLE `log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`log_level` text NOT NULL,
	`context_id` text,
	`action` text NOT NULL,
	`domain` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`data` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `log_date_idx` ON `log` (`date`);--> statement-breakpoint
CREATE INDEX `log_domain_idx` ON `log` (`domain`);--> statement-breakpoint
CREATE INDEX `log_level_idx` ON `log` (`log_level`);--> statement-breakpoint
CREATE INDEX `log_context_idx` ON `log` (`context_id`);--> statement-breakpoint
CREATE INDEX `log_code_idx` ON `log` (`code`);
CREATE TABLE `import_item_detail` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`journal_id` text,
	`import_info` text,
	`is_duplicate` integer DEFAULT false NOT NULL,
	`is_error` integer DEFAULT false NOT NULL,
	`is_imported` integer DEFAULT false NOT NULL,
	`processed_info` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `import` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL,
	`title` text NOT NULL,
	`filename` text NOT NULL,
	`complete` integer DEFAULT false NOT NULL,
	`source` text NOT NULL,
	`processed` integer DEFAULT false NOT NULL,
	`error` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `label_import_idx` ON `import_item_detail` (`import_id`);--> statement-breakpoint
CREATE INDEX `label_journal_idx` ON `import_item_detail` (`journal_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `import_item_detail_journal_id_import_id_unique` ON `import_item_detail` (`journal_id`,`import_id`);
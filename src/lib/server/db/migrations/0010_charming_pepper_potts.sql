CREATE TABLE `import_item_detail` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`journal_id` text NOT NULL,
	`import_info` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `import` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL,
	`filename` text NOT NULL,
	`complete` integer DEFAULT false NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE journal_entry ADD `import_id` text;--> statement-breakpoint
CREATE INDEX `label_import_idx` ON `import_item_detail` (`import_id`);--> statement-breakpoint
CREATE INDEX `label_journal_idx` ON `import_item_detail` (`journal_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `import_item_detail_journal_id_import_id_unique` ON `import_item_detail` (`journal_id`,`import_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `journal_entry_import_id_unique` ON `journal_entry` (`import_id`);
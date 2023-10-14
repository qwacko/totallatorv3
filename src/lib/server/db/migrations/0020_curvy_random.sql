CREATE TABLE `import_item_detail` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`duplicate_id` text,
	`relation_id` text,
	`relation_2_id` text,
	`import_info` text,
	`processed_info` text,
	`error_info` text,
	`status` text DEFAULT 'error' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `import` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL,
	`title` text NOT NULL,
	`filename` text,
	`status` text DEFAULT 'error' NOT NULL,
	`source` text DEFAULT 'csv' NOT NULL,
	`type` text DEFAULT 'transaction' NOT NULL,
	`error_info` text
);
--> statement-breakpoint
CREATE INDEX `importDetail_import_idx` ON `import_item_detail` (`import_id`);--> statement-breakpoint
CREATE INDEX `importDetail_duplicate_idx` ON `import_item_detail` (`duplicate_id`);--> statement-breakpoint
CREATE INDEX `importDetail_relation_idx` ON `import_item_detail` (`relation_id`);--> statement-breakpoint
CREATE INDEX `importDetail_relation_2_idx` ON `import_item_detail` (`relation_2_id`);--> statement-breakpoint
CREATE INDEX `importDetail_status_idx` ON `import_item_detail` (`status`);--> statement-breakpoint
CREATE INDEX `label_status_idx` ON `import` (`status`);--> statement-breakpoint
CREATE INDEX `label_source_idx` ON `import` (`source`);--> statement-breakpoint
CREATE INDEX `label_type_idx` ON `import` (`type`);
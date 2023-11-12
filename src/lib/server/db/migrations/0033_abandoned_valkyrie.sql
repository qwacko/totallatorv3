CREATE TABLE `import_mapping` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL,
	`title` text NOT NULL,
	`configuration` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE import ADD `mapped_import_id` text;--> statement-breakpoint
CREATE INDEX `label_mapped_import_idx` ON `import` (`mapped_import_id`);
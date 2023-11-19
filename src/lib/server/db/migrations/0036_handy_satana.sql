ALTER TABLE import_item_detail ADD `unique_id` text;--> statement-breakpoint
ALTER TABLE import ADD `check_imported_only` integer DEFAULT false NOT NULL;
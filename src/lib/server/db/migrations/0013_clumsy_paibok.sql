ALTER TABLE import_item_detail ADD `is_duplicate` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE import_item_detail ADD `is_error` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE import_item_detail ADD `is_imported` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE import_item_detail ADD `processed_info` text;--> statement-breakpoint
ALTER TABLE import ADD `processed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE import ADD `error` integer DEFAULT false NOT NULL;
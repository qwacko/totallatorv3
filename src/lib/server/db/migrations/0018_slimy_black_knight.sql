ALTER TABLE import_item_detail ADD `error_info` text;--> statement-breakpoint
ALTER TABLE import ADD `error_info` text;--> statement-breakpoint
ALTER TABLE `import` DROP COLUMN `error_text`;
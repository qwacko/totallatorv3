DROP INDEX IF EXISTS `journal_entry_import_id_unique`;--> statement-breakpoint
ALTER TABLE account ADD `import_id` text;--> statement-breakpoint
ALTER TABLE account ADD `account_import_detail_id` text;--> statement-breakpoint
ALTER TABLE bill ADD `import_id` text;--> statement-breakpoint
ALTER TABLE bill ADD `bill_import_detail_id` text;--> statement-breakpoint
ALTER TABLE budget ADD `import_id` text;--> statement-breakpoint
ALTER TABLE budget ADD `budget_import_detail_id` text;--> statement-breakpoint
ALTER TABLE category ADD `import_id` text;--> statement-breakpoint
ALTER TABLE category ADD `category_import_detail_id` text;--> statement-breakpoint
ALTER TABLE import_item_detail ADD `bill_id` text;--> statement-breakpoint
ALTER TABLE import_item_detail ADD `budget_id` text;--> statement-breakpoint
ALTER TABLE import_item_detail ADD `category_id` text;--> statement-breakpoint
ALTER TABLE import_item_detail ADD `account_id` text;--> statement-breakpoint
ALTER TABLE import_item_detail ADD `tag_id` text;--> statement-breakpoint
ALTER TABLE import_item_detail ADD `label_id` text;--> statement-breakpoint
ALTER TABLE import ADD `type` text DEFAULT 'transaction' NOT NULL;--> statement-breakpoint
ALTER TABLE label ADD `import_id` text;--> statement-breakpoint
ALTER TABLE label ADD `label_import_detail_id` text;--> statement-breakpoint
ALTER TABLE tag ADD `import_id` text;--> statement-breakpoint
ALTER TABLE tag ADD `tag_import_detail_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `account_account_import_detail_id_unique` ON `account` (`account_import_detail_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bill_bill_import_detail_id_unique` ON `bill` (`bill_import_detail_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `budget_budget_import_detail_id_unique` ON `budget` (`budget_import_detail_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_category_import_detail_id_unique` ON `category` (`category_import_detail_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `label_label_import_detail_id_unique` ON `label` (`label_import_detail_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tag_tag_import_detail_id_unique` ON `tag` (`tag_import_detail_id`);
ALTER TABLE filter ADD `modification_type` text DEFAULT 'replace' NOT NULL;--> statement-breakpoint
ALTER TABLE `filter` DROP COLUMN `modifier`;
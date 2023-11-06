ALTER TABLE filter ADD `modification_type2` text DEFAULT 'replace';--> statement-breakpoint
ALTER TABLE `filter` DROP COLUMN `modification_type`;
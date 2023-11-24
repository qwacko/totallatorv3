ALTER TABLE filter ADD `journal_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `import` DROP COLUMN `journal_count`;
ALTER TABLE journal_entry ADD `import_detail_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `journal_entry_import_detail_id_unique` ON `journal_entry` (`import_detail_id`);
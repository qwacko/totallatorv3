CREATE TABLE `journals_to_journals` (
	`id` text PRIMARY KEY NOT NULL,
	`label_id` text NOT NULL,
	`journal_id` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `parentJournal_idx` ON `journals_to_journals` (`label_id`);--> statement-breakpoint
CREATE INDEX `otherjournal_idx` ON `journals_to_journals` (`journal_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `journals_to_journals_journal_id_label_id_unique` ON `journals_to_journals` (`journal_id`,`label_id`);
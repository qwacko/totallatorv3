CREATE TABLE `label` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`deleted` integer DEFAULT true NOT NULL,
	`disabled` integer DEFAULT true NOT NULL,
	`allow_update` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `labels_to_journals` (
	`id` text PRIMARY KEY NOT NULL,
	`label_id` text NOT NULL,
	`journal_id` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `label_title_unique` ON `label` (`title`);--> statement-breakpoint
CREATE INDEX `label_idx` ON `labels_to_journals` (`label_id`);--> statement-breakpoint
CREATE INDEX `journal_idx` ON `labels_to_journals` (`journal_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `labels_to_journals_journal_id_label_id_unique` ON `labels_to_journals` (`journal_id`,`label_id`);
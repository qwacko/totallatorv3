CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text,
	`is_cash` integer DEFAULT false NOT NULL,
	`is_net_worth` integer DEFAULT false NOT NULL,
	`account_group` text,
	`account_group_2` text,
	`account_group_3` text,
	`account_group_combined` text,
	`account_title_combined` text,
	`start_date` integer,
	`end_date` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`deleted` integer DEFAULT true NOT NULL,
	`disabled` integer DEFAULT true NOT NULL,
	`allow_update` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `bill` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`deleted` integer DEFAULT true NOT NULL,
	`disabled` integer DEFAULT true NOT NULL,
	`allow_update` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `budget` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`deleted` integer DEFAULT true NOT NULL,
	`disabled` integer DEFAULT true NOT NULL,
	`allow_update` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`group` text,
	`single` text,
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`deleted` integer DEFAULT true NOT NULL,
	`disabled` integer DEFAULT true NOT NULL,
	`allow_update` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `journal_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`transaction_id` text NOT NULL,
	`description` text NOT NULL,
	`date` integer NOT NULL,
	`date_text` text NOT NULL,
	`tag_id` text,
	`bill_id` text,
	`budget_id` text,
	`category_id` text,
	`account_id` text,
	`year_month_day` text NOT NULL,
	`year_week` text NOT NULL,
	`year_month` text NOT NULL,
	`year_quarter` text NOT NULL,
	`year` text NOT NULL,
	`linked` integer DEFAULT true NOT NULL,
	`reconciled` integer DEFAULT false NOT NULL,
	`data_checked` integer DEFAULT false NOT NULL,
	`complete` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`group` text,
	`single` text,
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`deleted` integer DEFAULT true NOT NULL,
	`disabled` integer DEFAULT true NOT NULL,
	`allow_update` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_title_unique` ON `account` (`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_account_group_account_group_2_account_group_3_title_unique` ON `account` (`account_group`,`account_group_2`,`account_group_3`,`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `bill_title_unique` ON `bill` (`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `budget_title_unique` ON `budget` (`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_group_single_unique` ON `category` (`group`,`single`);--> statement-breakpoint
CREATE UNIQUE INDEX `tag_group_single_unique` ON `tag` (`group`,`single`);
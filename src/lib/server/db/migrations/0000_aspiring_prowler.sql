CREATE TABLE `user_key` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`hashed_password` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`active_expires` blob NOT NULL,
	`idle_expires` blob NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`admin` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text DEFAULT 'expense' NOT NULL,
	`is_cash` integer DEFAULT false NOT NULL,
	`is_net_worth` integer DEFAULT false NOT NULL,
	`account_group` text NOT NULL,
	`account_group_2` text NOT NULL,
	`account_group_3` text NOT NULL,
	`account_group_combined` text NOT NULL,
	`account_title_combined` text NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`deleted` integer DEFAULT true NOT NULL,
	`disabled` integer DEFAULT true NOT NULL,
	`allow_update` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
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
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
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
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`group` text NOT NULL,
	`single` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`deleted` integer DEFAULT true NOT NULL,
	`disabled` integer DEFAULT true NOT NULL,
	`allow_update` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
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
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`group` text NOT NULL,
	`single` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`deleted` integer DEFAULT true NOT NULL,
	`disabled` integer DEFAULT true NOT NULL,
	`allow_update` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_title_unique` ON `account` (`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_account_title_combined_unique` ON `account` (`account_title_combined`);--> statement-breakpoint
CREATE UNIQUE INDEX `bill_title_unique` ON `bill` (`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `budget_title_unique` ON `budget` (`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_title_unique` ON `category` (`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `tag_title_unique` ON `tag` (`title`);
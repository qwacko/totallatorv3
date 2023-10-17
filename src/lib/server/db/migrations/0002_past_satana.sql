ALTER TABLE `account` RENAME TO `account_temp`; --> statement-breakpoint
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
	`start_date` text,  
	`end_date` text,    
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`deleted` integer DEFAULT true NOT NULL,
	`disabled` integer DEFAULT true NOT NULL,
	`allow_update` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer NOT NULL
); 
--> statement-breakpoint
INSERT INTO `account` SELECT * FROM `account_temp`;--> statement-breakpoint
DROP TABLE `account_temp`;--> statement-breakpoint
CREATE UNIQUE INDEX `account_title_unique` ON `account` (`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_account_title_combined_unique` ON `account` (`account_title_combined`);

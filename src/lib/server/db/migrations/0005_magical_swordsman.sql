
-- 1. Identify the transaction_id values of the entries with a null account_id
CREATE TEMP TABLE TempTransactionIds AS
SELECT `journal_entry`.`transaction_id`
FROM `journal_entry`
WHERE `journal_entry`.`account_id` IS NULL;--> statement-breakpoint

-- 2. Delete all entries with those transaction_id values from journal_entry
DELETE FROM `journal_entry`
WHERE `journal_entry`.`transaction_id` IN (SELECT transaction_id FROM TempTransactionIds);--> statement-breakpoint

-- 3. Delete all entries with those transaction_id values from transaction table
DELETE FROM `transaction`
WHERE id IN (SELECT transaction_id FROM TempTransactionIds);--> statement-breakpoint

-- 4. Rename the existing table
ALTER TABLE `journal_entry` RENAME TO `journal_entry_temp`;--> statement-breakpoint

-- 5. Create a new table with the accountId column set to NOT NULL
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
	`account_id` text NOT NULL, -- This is the modified column
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
); --> statement-breakpoint

-- 6. Copy the data from the old table to the new table
INSERT INTO `journal_entry` SELECT * FROM `journal_entry_temp`;--> statement-breakpoint

-- 7. Drop the old table
DROP TABLE `journal_entry_temp`;--> statement-breakpoint

-- 8. Clean up the temporary table
DROP TABLE TempTransactionIds;

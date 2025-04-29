DROP INDEX "file_transaction_idx";--> statement-breakpoint
DROP INDEX "file_account_idx";--> statement-breakpoint
DROP INDEX "file_bill_idx";--> statement-breakpoint
DROP INDEX "file_budget_idx";--> statement-breakpoint
DROP INDEX "file_category_idx";--> statement-breakpoint
DROP INDEX "file_tag_idx";--> statement-breakpoint
DROP INDEX "file_label_idx";--> statement-breakpoint
DROP INDEX "file_auto_import_idx";--> statement-breakpoint
DROP INDEX "file_report_idx";--> statement-breakpoint
DROP INDEX "file_report_element_idx";--> statement-breakpoint
DROP INDEX "note_transaction_idx";--> statement-breakpoint
DROP INDEX "note_account_idx";--> statement-breakpoint
DROP INDEX "note_bill_idx";--> statement-breakpoint
DROP INDEX "note_budget_idx";--> statement-breakpoint
DROP INDEX "note_category_idx";--> statement-breakpoint
DROP INDEX "note_tag_idx";--> statement-breakpoint
DROP INDEX "note_label_idx";--> statement-breakpoint
DROP INDEX "note_created_by_idx";--> statement-breakpoint
DROP INDEX "note_file_idx";--> statement-breakpoint
DROP INDEX "note_auto_import_idx";--> statement-breakpoint
DROP INDEX "note_report_idx";--> statement-breakpoint
DROP INDEX "note_report_element_idx";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "linked";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "transaction_id";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "account_id";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "bill_id";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "budget_id";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "tag_id";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "label_id";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "auto_import_id";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "report_id";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "report_element_id";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "transaction_id";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "account_id";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "bill_id";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "budget_id";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "tag_id";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "label_id";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "file_id";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "auto_import_id";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "report_id";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "report_element_id";
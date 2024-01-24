ALTER TABLE "report_element_config" ADD COLUMN "configuration_json" jsonb;--> statement-breakpoint
ALTER TABLE "report_element_config" DROP COLUMN IF EXISTS "configuration";--> statement-breakpoint
ALTER TABLE "report_element_config" DROP COLUMN IF EXISTS "configuration_text";
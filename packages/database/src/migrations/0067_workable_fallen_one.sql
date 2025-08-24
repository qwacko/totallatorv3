CREATE TABLE "journal_llm_suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"journal_id" text NOT NULL,
	"llm_settings_id" text NOT NULL,
	"suggested_payee" text,
	"suggested_description" text,
	"suggested_category_id" text,
	"suggested_tag_id" text,
	"suggested_bill_id" text,
	"suggested_budget_id" text,
	"suggested_account_id" text,
	"confidence_score" real,
	"reasoning" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"processed_by" text,
	"llm_log_id" text,
	"version" text DEFAULT '1' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal_llm_suggestions" ADD CONSTRAINT "journal_llm_suggestions_journal_id_journal_entry_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_llm_suggestions" ADD CONSTRAINT "journal_llm_suggestions_llm_settings_id_llm_settings_id_fk" FOREIGN KEY ("llm_settings_id") REFERENCES "public"."llm_settings"("id") ON DELETE no action ON UPDATE no action;
CREATE TABLE "agent_run" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"trigger_source" text,
	"llm_settings_id" text,
	"provider" text,
	"model" text,
	"prompt_version" text,
	"initiated_by_user_id" text,
	"target_journal_count" integer DEFAULT 0 NOT NULL,
	"processed_journal_count" integer DEFAULT 0 NOT NULL,
	"accepted_suggestion_count" integer DEFAULT 0 NOT NULL,
	"rejected_suggestion_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"metadata" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_run_event" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_run_id" text NOT NULL,
	"type" text NOT NULL,
	"journal_id" text,
	"step_index" integer,
	"summary" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal_llm_suggestions" ADD COLUMN "agent_run_id" text;--> statement-breakpoint
ALTER TABLE "journal_llm_suggestions" ADD COLUMN "suggestion_payload" jsonb;--> statement-breakpoint
ALTER TABLE "agent_run" ADD CONSTRAINT "agent_run_llm_settings_id_llm_settings_id_fk" FOREIGN KEY ("llm_settings_id") REFERENCES "public"."llm_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_run_event" ADD CONSTRAINT "agent_run_event_agent_run_id_agent_run_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_run_event" ADD CONSTRAINT "agent_run_event_journal_id_journal_entry_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_run_task_id_idx" ON "agent_run" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "agent_run_status_idx" ON "agent_run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_run_llm_settings_id_idx" ON "agent_run" USING btree ("llm_settings_id");--> statement-breakpoint
CREATE INDEX "agent_run_initiated_by_user_id_idx" ON "agent_run" USING btree ("initiated_by_user_id");--> statement-breakpoint
CREATE INDEX "agent_run_created_at_idx" ON "agent_run" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_run_event_agent_run_id_idx" ON "agent_run_event" USING btree ("agent_run_id");--> statement-breakpoint
CREATE INDEX "agent_run_event_type_idx" ON "agent_run_event" USING btree ("type");--> statement-breakpoint
CREATE INDEX "agent_run_event_journal_id_idx" ON "agent_run_event" USING btree ("journal_id");--> statement-breakpoint
CREATE INDEX "agent_run_event_created_at_idx" ON "agent_run_event" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "journal_llm_suggestions" ADD CONSTRAINT "journal_llm_suggestions_agent_run_id_agent_run_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_run"("id") ON DELETE no action ON UPDATE no action;
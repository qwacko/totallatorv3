CREATE TABLE "llm_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"api_url" text NOT NULL,
	"api_key" text NOT NULL,
	"default_model" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"llm_settings_id" text,
	"request_payload" jsonb NOT NULL,
	"response_payload" jsonb NOT NULL,
	"duration_ms" integer NOT NULL,
	"status" text NOT NULL,
	"related_journal_id" text
);
--> statement-breakpoint
ALTER TABLE "llm_logs" ADD CONSTRAINT "llm_logs_llm_settings_id_llm_settings_id_fk" FOREIGN KEY ("llm_settings_id") REFERENCES "public"."llm_settings"("id") ON DELETE no action ON UPDATE no action;
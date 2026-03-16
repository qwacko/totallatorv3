CREATE TABLE "transaction_change" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"change_type" text NOT NULL,
	"source_type" text NOT NULL,
	"actor_user_id" text,
	"actor_user_name" text,
	"source_import_id" text,
	"source_import_title" text,
	"source_import_detail_id" text,
	"source_filter_id" text,
	"source_filter_title" text,
	"summary" text,
	"changed_fields" jsonb,
	"before_snapshot" jsonb,
	"after_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "transaction_change_transaction_id_idx" ON "transaction_change" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_change_change_type_idx" ON "transaction_change" USING btree ("change_type");--> statement-breakpoint
CREATE INDEX "transaction_change_source_type_idx" ON "transaction_change" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "transaction_change_source_import_id_idx" ON "transaction_change" USING btree ("source_import_id");--> statement-breakpoint
CREATE INDEX "transaction_change_actor_user_id_idx" ON "transaction_change" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "transaction_change_created_at_idx" ON "transaction_change" USING btree ("created_at");
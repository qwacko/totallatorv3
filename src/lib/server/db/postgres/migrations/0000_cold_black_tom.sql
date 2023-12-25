CREATE TABLE IF NOT EXISTS "user_key" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(15) NOT NULL,
	"hashed_password" varchar(15)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_session" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(15) NOT NULL,
	"active_expires" bigint NOT NULL,
	"idle_expires" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'New User' NOT NULL,
	"username" text NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	"currencyFormat" text DEFAULT 'USD' NOT NULL,
	"dateFormat" text DEFAULT 'YYYY-MM-DD' NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"account_import_detail_id" text,
	"title" text NOT NULL,
	"type" text DEFAULT 'expense' NOT NULL,
	"is_cash" boolean DEFAULT false NOT NULL,
	"is_net_worth" boolean DEFAULT false NOT NULL,
	"account_group" text NOT NULL,
	"account_group_2" text NOT NULL,
	"account_group_3" text NOT NULL,
	"account_group_combined" text NOT NULL,
	"account_title_combined" text NOT NULL,
	"start_date" varchar(10),
	"end_date" varchar(10),
	"summary_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "account_account_title_combined_unique" UNIQUE("account_title_combined")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bill" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"bill_import_detail_id" text,
	"title" text NOT NULL,
	"summary_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "bill_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "budget" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"budget_import_detail_id" text,
	"title" text NOT NULL,
	"summary_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "budget_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"category_import_detail_id" text,
	"title" text NOT NULL,
	"group" text NOT NULL,
	"single" text NOT NULL,
	"summary_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "category_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "import_item_detail" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text NOT NULL,
	"status" text DEFAULT 'error' NOT NULL,
	"duplicate_id" text,
	"unique_id" text,
	"relation_id" text,
	"relation_2_id" text,
	"import_info" json,
	"processed_info" json,
	"error_info" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "import_mapping" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"title" text NOT NULL,
	"configuration" text NOT NULL,
	"sample_data" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "import" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"title" text NOT NULL,
	"filename" text,
	"check_imported_only" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'error' NOT NULL,
	"source" text DEFAULT 'csv' NOT NULL,
	"type" text DEFAULT 'transaction' NOT NULL,
	"mapped_import_id" text,
	"error_info" json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"import_detail_id" text,
	"unique_id" text,
	"amount" integer DEFAULT 0 NOT NULL,
	"transaction_id" text NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"date_text" text NOT NULL,
	"tag_id" text,
	"bill_id" text,
	"budget_id" text,
	"category_id" text,
	"account_id" text NOT NULL,
	"year_month_day" text NOT NULL,
	"year_week" text NOT NULL,
	"year_month" text NOT NULL,
	"year_quarter" text NOT NULL,
	"year" text NOT NULL,
	"linked" boolean DEFAULT true NOT NULL,
	"reconciled" boolean DEFAULT false NOT NULL,
	"data_checked" boolean DEFAULT false NOT NULL,
	"complete" boolean DEFAULT false NOT NULL,
	"transfer" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "label" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"label_import_detail_id" text,
	"title" text NOT NULL,
	"summary_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "label_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "labels_to_journals" (
	"id" text PRIMARY KEY NOT NULL,
	"label_id" text NOT NULL,
	"journal_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "labels_to_journals_journal_id_label_id_unique" UNIQUE("journal_id","label_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "filter" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"title" text NOT NULL,
	"group" text,
	"journal_count" integer DEFAULT 0 NOT NULL,
	"can_apply" boolean DEFAULT false NOT NULL,
	"needs_update" boolean DEFAULT true NOT NULL,
	"apply_automatically" boolean DEFAULT false NOT NULL,
	"apply_following_import" boolean DEFAULT false NOT NULL,
	"listed" boolean DEFAULT true NOT NULL,
	"modification_type" text DEFAULT 'replace',
	"filter" text NOT NULL,
	"filter_text" text NOT NULL,
	"change" text,
	"change_text" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "summary" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"type" text NOT NULL,
	"needs_update" boolean DEFAULT true NOT NULL,
	"relation_id" text NOT NULL,
	"sum" integer DEFAULT 0,
	"count" integer DEFAULT 0,
	"first_date" timestamp,
	"last_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"tag_import_detail_id" text,
	"title" text NOT NULL,
	"group" text NOT NULL,
	"single" text NOT NULL,
	"summary_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "tag_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "importDetail_import_idx" ON "import_item_detail" ("import_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "importDetail_duplicate_idx" ON "import_item_detail" ("duplicate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "importDetail_relation_idx" ON "import_item_detail" ("relation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "importDetail_relation_2_idx" ON "import_item_detail" ("relation_2_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "importDetail_status_idx" ON "import_item_detail" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "label_status_idx" ON "import" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "label_source_idx" ON "import" ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "label_type_idx" ON "import" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "label_mapped_import_idx" ON "import" ("mapped_import_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "label_idx" ON "labels_to_journals" ("label_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journal_idx" ON "labels_to_journals" ("journal_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_key" ADD CONSTRAINT "user_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TYPE "public"."report_size" AS ENUM('sm', 'lg', 'xs', 'xl');--> statement-breakpoint
CREATE TABLE "user_key" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(62) NOT NULL,
	"hashed_password" varchar(255),
	CONSTRAINT "user_key_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_session" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(61) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'New User' NOT NULL,
	"username" text NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	"currencyFormat" text DEFAULT 'USD' NOT NULL,
	"dateFormat" text DEFAULT 'YYYY-MM-DD' NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"account_import_detail_id" text,
	"title" text NOT NULL,
	"type" text DEFAULT 'expense' NOT NULL,
	"is_cash" boolean DEFAULT false NOT NULL,
	"is_net_worth" boolean DEFAULT false NOT NULL,
	"is_catchall" boolean DEFAULT false NOT NULL,
	"account_group" text NOT NULL,
	"account_group_2" text NOT NULL,
	"account_group_3" text NOT NULL,
	"account_group_combined" text NOT NULL,
	"account_title_combined" text NOT NULL,
	"start_date" varchar(10),
	"end_date" varchar(10),
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	CONSTRAINT "account_account_title_combined_unique" UNIQUE("account_title_combined")
);
--> statement-breakpoint
CREATE TABLE "associated_info" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"created_by" text NOT NULL,
	"title" text,
	"linked" boolean NOT NULL,
	"transaction_id" text,
	"account_id" text,
	"bill_id" text,
	"budget_id" text,
	"category_id" text,
	"tag_id" text,
	"label_id" text,
	"auto_import_id" text,
	"report_id" text,
	"report_element_id" text
);
--> statement-breakpoint
CREATE TABLE "auto_import" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"mapped_import_id" text NOT NULL,
	"frequency" text NOT NULL,
	"type" text NOT NULL,
	"last_transaction_date" timestamp,
	"auto_process" boolean DEFAULT true NOT NULL,
	"auto_clean" boolean DEFAULT true NOT NULL,
	"config" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backup_table" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text NOT NULL,
	"filename" text NOT NULL,
	"file_exists" boolean NOT NULL,
	"version" integer NOT NULL,
	"restore_date" timestamp,
	"compressed" boolean NOT NULL,
	"creation_reason" text NOT NULL,
	"created_by" text NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"information" jsonb NOT NULL,
	CONSTRAINT "backup_table_filename_unique" UNIQUE("filename")
);
--> statement-breakpoint
CREATE TABLE "bill" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"bill_import_detail_id" text,
	"title" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	CONSTRAINT "bill_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "budget" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"budget_import_detail_id" text,
	"title" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	CONSTRAINT "budget_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"category_import_detail_id" text,
	"title" text NOT NULL,
	"group" text NOT NULL,
	"single" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	CONSTRAINT "category_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text,
	"associated_info_id" text NOT NULL,
	"reason" text NOT NULL,
	"original_filename" text NOT NULL,
	"filename" text NOT NULL,
	"thumbnail_filename" text,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"file_exists" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "single_filter" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"filter" jsonb NOT NULL,
	"filter_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filters_to_report_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"report_element_config_id" text NOT NULL,
	"filter_id" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "filters_to_report_configs_report_element_config_id_filter_id_unique" UNIQUE("report_element_config_id","filter_id"),
	CONSTRAINT "filters_to_report_configs_report_element_config_id_order_unique" UNIQUE("report_element_config_id","order")
);
--> statement-breakpoint
CREATE TABLE "import_item_detail" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text NOT NULL,
	"status" text DEFAULT 'error' NOT NULL,
	"status_text" text,
	"duplicate_id" text,
	"unique_id" text,
	"relation_id" text,
	"relation_2_id" text,
	"import_info" json,
	"processed_info" json,
	"error_info" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_mapping" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text NOT NULL,
	"configuration" text NOT NULL,
	"sample_data" text
);
--> statement-breakpoint
CREATE TABLE "import" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text NOT NULL,
	"filename" text,
	"check_imported_only" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'error' NOT NULL,
	"source" text DEFAULT 'csv' NOT NULL,
	"type" text DEFAULT 'transaction' NOT NULL,
	"auto_process" boolean DEFAULT false NOT NULL,
	"auto_clean" boolean DEFAULT false NOT NULL,
	"mapped_import_id" text,
	"auto_import_id" text,
	"error_info" json,
	"import_status" jsonb DEFAULT 'null'::jsonb
);
--> statement-breakpoint
CREATE TABLE "journal_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"import_detail_id" text,
	"unique_id" text,
	"amount" numeric(20, 4) DEFAULT 0 NOT NULL,
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
	"updated_at" timestamp (6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"associated_info_id" text NOT NULL,
	"count" integer NOT NULL,
	"sum" numeric(20, 4) NOT NULL,
	"average" numeric(20, 4) NOT NULL,
	"earliest" timestamp NOT NULL,
	"latest" timestamp NOT NULL,
	"earliestText" text NOT NULL,
	"latestText" text NOT NULL,
	"positive_sum" numeric(20, 4) NOT NULL,
	"positive_count" integer NOT NULL,
	"negative_sum" numeric(20, 4) NOT NULL,
	"negative_count" integer NOT NULL,
	"positive_sum_non_transfer" numeric(20, 4) NOT NULL,
	"positive_count_non_transfer" integer NOT NULL,
	"negative_sum_non_transfer" numeric(20, 4) NOT NULL,
	"negative_count_non_transfer" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_value_table" (
	"key" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "key_value_table_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "label" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"label_import_detail_id" text,
	"title" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	CONSTRAINT "label_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "labels_to_journals" (
	"id" text PRIMARY KEY NOT NULL,
	"label_id" text NOT NULL,
	"journal_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	CONSTRAINT "labels_to_journals_journal_id_label_id_unique" UNIQUE("journal_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"note" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"associated_info_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text NOT NULL,
	"group" text,
	"size" "report_size" DEFAULT 'xl' NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"filter_id" text
);
--> statement-breakpoint
CREATE TABLE "report_element" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text,
	"report_id" text NOT NULL,
	"rows" integer DEFAULT 0 NOT NULL,
	"cols" integer DEFAULT 0 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"report_element_config_id" text NOT NULL,
	"filter_id" text
);
--> statement-breakpoint
CREATE TABLE "report_element_config" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	"title" text,
	"group" text,
	"locked" boolean DEFAULT false NOT NULL,
	"reusable" boolean DEFAULT false NOT NULL,
	"layout" text DEFAULT 'singleItem' NOT NULL,
	"config" jsonb
);
--> statement-breakpoint
CREATE TABLE "filter" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
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
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text,
	"tag_import_detail_id" text,
	"title" text NOT NULL,
	"group" text NOT NULL,
	"single" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled" boolean DEFAULT true NOT NULL,
	"allow_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	CONSTRAINT "tag_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_contents" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"query" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_log" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"title" text,
	"title_id" varchar(60),
	"query" text,
	"query_id" varchar(60),
	"time" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"params" text,
	"size" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_log_title" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "cronJob" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"schedule" text NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"timeoutMs" integer DEFAULT 120000 NOT NULL,
	"maxRetries" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" text DEFAULT 'system' NOT NULL,
	"lastModifiedBy" text DEFAULT 'system' NOT NULL,
	CONSTRAINT "cronJob_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cronJobConfig" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cronJobConfig_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "cronJobExecution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cronJobId" uuid NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"durationMs" integer,
	"status" text DEFAULT 'running' NOT NULL,
	"exitCode" integer,
	"output" text,
	"errorMessage" text,
	"stackTrace" text,
	"triggeredBy" text DEFAULT 'scheduler' NOT NULL,
	"triggeredByUserId" text,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"memoryUsageMb" integer,
	"cpuUsagePercent" integer
);
--> statement-breakpoint
ALTER TABLE "user_key" ADD CONSTRAINT "user_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_llm_suggestions" ADD CONSTRAINT "journal_llm_suggestions_journal_id_journal_entry_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal_entry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_llm_suggestions" ADD CONSTRAINT "journal_llm_suggestions_llm_settings_id_llm_settings_id_fk" FOREIGN KEY ("llm_settings_id") REFERENCES "public"."llm_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cronJobExecution" ADD CONSTRAINT "cronJobExecution_cronJobId_cronJob_id_fk" FOREIGN KEY ("cronJobId") REFERENCES "public"."cronJob"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_title_idx" ON "account" USING btree ("title");--> statement-breakpoint
CREATE INDEX "account_type_idx" ON "account" USING btree ("type");--> statement-breakpoint
CREATE INDEX "account_is_cash_idx" ON "account" USING btree ("is_cash");--> statement-breakpoint
CREATE INDEX "account_is_net_worth_idx" ON "account" USING btree ("is_net_worth");--> statement-breakpoint
CREATE INDEX "account_account_group_combined_idx" ON "account" USING btree ("account_group_combined");--> statement-breakpoint
CREATE INDEX "account_account_title_combined_idx" ON "account" USING btree ("account_title_combined");--> statement-breakpoint
CREATE INDEX "associated_info_created_by_idx" ON "associated_info" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "associated_info_transaction_idx" ON "associated_info" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "associated_info_account_idx" ON "associated_info" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "associated_info_bill_idx" ON "associated_info" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "associated_info_budget_idx" ON "associated_info" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "associated_info_category_idx" ON "associated_info" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "associated_info_tag_idx" ON "associated_info" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "associated_info_label_idx" ON "associated_info" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "associated_info_auto_import_idx" ON "associated_info" USING btree ("auto_import_id");--> statement-breakpoint
CREATE INDEX "associated_info_report_idx" ON "associated_info" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "associated_info_report_element_idx" ON "associated_info" USING btree ("report_element_id");--> statement-breakpoint
CREATE INDEX "auto_import_mapped_import_idx" ON "auto_import" USING btree ("mapped_import_id");--> statement-breakpoint
CREATE INDEX "auto_import_frequency_idx" ON "auto_import" USING btree ("frequency");--> statement-breakpoint
CREATE INDEX "auto_import_title_idx" ON "auto_import" USING btree ("title");--> statement-breakpoint
CREATE INDEX "auto_import_type_idx" ON "auto_import" USING btree ("type");--> statement-breakpoint
CREATE INDEX "bill_title_idx" ON "bill" USING btree ("title");--> statement-breakpoint
CREATE INDEX "budget_title_idx" ON "budget" USING btree ("title");--> statement-breakpoint
CREATE INDEX "category_title_idx" ON "category" USING btree ("title");--> statement-breakpoint
CREATE INDEX "category_group_idx" ON "category" USING btree ("group");--> statement-breakpoint
CREATE INDEX "category_single_idx" ON "category" USING btree ("single");--> statement-breakpoint
CREATE INDEX "file_associated_info_idx" ON "files" USING btree ("associated_info_id");--> statement-breakpoint
CREATE INDEX "file_reason_idx" ON "files" USING btree ("reason");--> statement-breakpoint
CREATE INDEX "file_title_idx" ON "files" USING btree ("title");--> statement-breakpoint
CREATE INDEX "file_filename_idx" ON "files" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "file_type_idx" ON "files" USING btree ("type");--> statement-breakpoint
CREATE INDEX "file_size_idx" ON "files" USING btree ("size");--> statement-breakpoint
CREATE INDEX "file_file_exists_idx" ON "files" USING btree ("file_exists");--> statement-breakpoint
CREATE INDEX "filter_filter_text_idx" ON "single_filter" USING btree ("filter_text");--> statement-breakpoint
CREATE INDEX "report_element_config__from_filter_idx" ON "filters_to_report_configs" USING btree ("report_element_config_id");--> statement-breakpoint
CREATE INDEX "filter_idx" ON "filters_to_report_configs" USING btree ("filter_id");--> statement-breakpoint
CREATE INDEX "importDetail_import_idx" ON "import_item_detail" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "importDetail_duplicate_idx" ON "import_item_detail" USING btree ("duplicate_id");--> statement-breakpoint
CREATE INDEX "importDetail_relation_idx" ON "import_item_detail" USING btree ("relation_id");--> statement-breakpoint
CREATE INDEX "importDetail_relation_2_idx" ON "import_item_detail" USING btree ("relation_2_id");--> statement-breakpoint
CREATE INDEX "importDetail_status_idx" ON "import_item_detail" USING btree ("status");--> statement-breakpoint
CREATE INDEX "label_status_idx" ON "import" USING btree ("status");--> statement-breakpoint
CREATE INDEX "label_source_idx" ON "import" USING btree ("source");--> statement-breakpoint
CREATE INDEX "label_type_idx" ON "import" USING btree ("type");--> statement-breakpoint
CREATE INDEX "label_mapped_import_idx" ON "import" USING btree ("mapped_import_id");--> statement-breakpoint
CREATE INDEX "import_auto_import_idx" ON "import" USING btree ("auto_import_id");--> statement-breakpoint
CREATE INDEX "journalEntry_created_at_idx" ON "journal_entry" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "journalEntry_transaction_id_idx" ON "journal_entry" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "journalEntry_date_amount_idx" ON "journal_entry" USING btree ("date","amount");--> statement-breakpoint
CREATE INDEX "journalEntry_date_idx" ON "journal_entry" USING btree ("date");--> statement-breakpoint
CREATE INDEX "journalEntry_date_text_idx" ON "journal_entry" USING btree ("date_text");--> statement-breakpoint
CREATE INDEX "journalEntry_description_idx" ON "journal_entry" USING btree ("description");--> statement-breakpoint
CREATE INDEX "journalEntry_transfer_idx" ON "journal_entry" USING btree ("transfer");--> statement-breakpoint
CREATE INDEX "journalEntry_complete_idx" ON "journal_entry" USING btree ("complete");--> statement-breakpoint
CREATE INDEX "journalEntry_reconciled_idx" ON "journal_entry" USING btree ("reconciled");--> statement-breakpoint
CREATE INDEX "journalEntry_data_checked_idx" ON "journal_entry" USING btree ("data_checked");--> statement-breakpoint
CREATE INDEX "journalEntry_account_id_idx" ON "journal_entry" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "journalEntry_bill_id_idx" ON "journal_entry" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "journalEntry_budget_id_idx" ON "journal_entry" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "journalEntry_category_id_idx" ON "journal_entry" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "journalEntry_tag_id_idx" ON "journal_entry" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "journalEntry_import_id_idx" ON "journal_entry" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "journalEntry_import_detail_id_idx" ON "journal_entry" USING btree ("import_detail_id");--> statement-breakpoint
CREATE INDEX "journalEntry_year_month_idx" ON "journal_entry" USING btree ("year_month");--> statement-breakpoint
CREATE INDEX "journal_snapshot_associated_info_idx" ON "journal_snapshot" USING btree ("associated_info_id");--> statement-breakpoint
CREATE INDEX "label_idx" ON "labels_to_journals" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "journal_idx" ON "labels_to_journals" USING btree ("journal_id");--> statement-breakpoint
CREATE INDEX "note_note_idx" ON "notes" USING btree ("note");--> statement-breakpoint
CREATE INDEX "note_type_idx" ON "notes" USING btree ("type");--> statement-breakpoint
CREATE INDEX "note_associated_info_idx" ON "notes" USING btree ("associated_info_id");--> statement-breakpoint
CREATE INDEX "report_title_idx" ON "report" USING btree ("title");--> statement-breakpoint
CREATE INDEX "report_group_idx" ON "report" USING btree ("group");--> statement-breakpoint
CREATE INDEX "report_title_group_idx" ON "report" USING btree ("title","group");--> statement-breakpoint
CREATE INDEX "report_locked_idx" ON "report" USING btree ("locked");--> statement-breakpoint
CREATE INDEX "report_filter_idx" ON "report" USING btree ("filter_id");--> statement-breakpoint
CREATE INDEX "report_element_config_idx" ON "report_element" USING btree ("report_element_config_id");--> statement-breakpoint
CREATE INDEX "report_idx" ON "report_element" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_element_filter_idx" ON "report_element" USING btree ("filter_id");--> statement-breakpoint
CREATE INDEX "report_element_config_title_idx" ON "report_element_config" USING btree ("title");--> statement-breakpoint
CREATE INDEX "report_element_config_group_idx" ON "report_element_config" USING btree ("group");--> statement-breakpoint
CREATE INDEX "report_element_config_reusable_idx" ON "report_element_config" USING btree ("reusable");--> statement-breakpoint
CREATE INDEX "report_element_config_title_group_idx" ON "report_element_config" USING btree ("title","group");--> statement-breakpoint
CREATE INDEX "report_element_config_locked_idx" ON "report_element_config" USING btree ("locked");--> statement-breakpoint
CREATE INDEX "filter_title_idx" ON "filter" USING btree ("title");--> statement-breakpoint
CREATE INDEX "filter_group_idx" ON "filter" USING btree ("group");--> statement-breakpoint
CREATE INDEX "filter_can_apply_idx" ON "filter" USING btree ("can_apply");--> statement-breakpoint
CREATE INDEX "filter_needs_update_idx" ON "filter" USING btree ("needs_update");--> statement-breakpoint
CREATE INDEX "filter_apply_automatically_idx" ON "filter" USING btree ("apply_automatically");--> statement-breakpoint
CREATE INDEX "filter_apply_following_import_idx" ON "filter" USING btree ("apply_following_import");--> statement-breakpoint
CREATE INDEX "filter_listed_idx" ON "filter" USING btree ("listed");--> statement-breakpoint
CREATE INDEX "filter_modification_type_idx" ON "filter" USING btree ("modification_type");--> statement-breakpoint
CREATE INDEX "tag_title_idx" ON "tag" USING btree ("title");--> statement-breakpoint
CREATE INDEX "tag_group_idx" ON "tag" USING btree ("group");--> statement-breakpoint
CREATE INDEX "tag_single_idx" ON "tag" USING btree ("single");--> statement-breakpoint
CREATE VIEW "public"."account_view" AS (with "filessq" as (select "associated_info"."account_id", count("files"."id") as "file_count" from "files" left join "associated_info" on "files"."associated_info_id" = "associated_info"."id" where "associated_info"."account_id" is not null group by "associated_info"."account_id"), "notessq" as (select "associated_info"."account_id", count("notes"."id") as "note_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where "associated_info"."account_id" is not null group by "associated_info"."account_id"), "reminderssq" as (select "associated_info"."account_id", count("notes"."id") as "reminder_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where ("notes"."type" = 'reminder' and "associated_info"."account_id" is not null) group by "associated_info"."account_id") select "account"."id", "account"."import_id", "account"."account_import_detail_id", "account"."title", "account"."type", "account"."is_cash", "account"."is_net_worth", "account"."is_catchall", "account"."account_group", "account"."account_group_2", "account"."account_group_3", "account"."account_group_combined", "account"."account_title_combined", "account"."start_date", "account"."end_date", "account"."status", "account"."active", "account"."disabled", "account"."allow_update", "account"."created_at", "account"."updated_at", sum("journal_entry"."amount") as "sum", count("journal_entry"."id") as "count", min("journal_entry"."date") as "firstDate", max("journal_entry"."date") as "lastDate", max("note_count") as "note_count", max("reminder_count") as "reminder_count", max("file_count") as "file_count" from "account" left join "journal_entry" on "account"."id" = "journal_entry"."account_id" left join "import" on "journal_entry"."import_id" = "import"."id" left join "filessq" on "account"."id" = "filessq"."account_id" left join "notessq" on "account"."id" = "notessq"."account_id" left join "reminderssq" on "account"."id" = "reminderssq"."account_id" group by "account"."id");--> statement-breakpoint
CREATE VIEW "public"."bill_view" AS (with "filessq" as (select "associated_info"."bill_id", count("files"."id") as "file_count" from "files" left join "associated_info" on "files"."associated_info_id" = "associated_info"."id" where "associated_info"."bill_id" is not null group by "associated_info"."bill_id"), "notessq" as (select "associated_info"."bill_id", count("notes"."id") as "note_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where "associated_info"."bill_id" is not null group by "associated_info"."bill_id"), "reminderssq" as (select "associated_info"."bill_id", count("notes"."id") as "reminder_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where ("notes"."type" = 'reminder' and "associated_info"."bill_id" is not null) group by "associated_info"."bill_id") select "bill"."id", "bill"."import_id", "bill"."bill_import_detail_id", "bill"."title", "bill"."status", "bill"."active", "bill"."disabled", "bill"."allow_update", "bill"."created_at", "bill"."updated_at", sum(CASE WHEN "account"."type" IN ('asset', 'liability') THEN "journal_entry"."amount" ELSE 0 END) as "sum", count(CASE WHEN "account"."type" IN ('asset', 'liability') THEN 1 ELSE NULL END) as "count", min("journal_entry"."date") as "firstDate", max("journal_entry"."date") as "lastDate", max("note_count") as "note_count", max("reminder_count") as "reminder_count", max("file_count") as "file_count" from "bill" left join "journal_entry" on "bill"."id" = "journal_entry"."bill_id" left join "account" on "journal_entry"."account_id" = "account"."id" left join "filessq" on "bill"."id" = "filessq"."bill_id" left join "notessq" on "bill"."id" = "notessq"."bill_id" left join "reminderssq" on "bill"."id" = "reminderssq"."bill_id" group by "bill"."id");--> statement-breakpoint
CREATE VIEW "public"."budget_view" AS (with "filessq" as (select "associated_info"."budget_id", count("files"."id") as "file_count" from "files" left join "associated_info" on "files"."associated_info_id" = "associated_info"."id" where "associated_info"."budget_id" is not null group by "associated_info"."budget_id"), "notessq" as (select "associated_info"."budget_id", count("notes"."id") as "note_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where "associated_info"."budget_id" is not null group by "associated_info"."budget_id"), "reminderssq" as (select "associated_info"."budget_id", count("notes"."id") as "reminder_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where ("notes"."type" = 'reminder' and "associated_info"."budget_id" is not null) group by "associated_info"."budget_id") select "budget"."id", "budget"."import_id", "budget"."budget_import_detail_id", "budget"."title", "budget"."status", "budget"."active", "budget"."disabled", "budget"."allow_update", "budget"."created_at", "budget"."updated_at", sum(CASE WHEN "account"."type" IN ('asset', 'liability') THEN "journal_entry"."amount" ELSE 0 END) as "sum", count(CASE WHEN "account"."type" IN ('asset', 'liability') THEN 1 ELSE NULL END) as "count", min("journal_entry"."date") as "firstDate", max("journal_entry"."date") as "lastDate", max("note_count") as "note_count", max("reminder_count") as "reminder_count", max("file_count") as "file_count" from "budget" left join "journal_entry" on "budget"."id" = "journal_entry"."budget_id" left join "account" on "journal_entry"."account_id" = "account"."id" left join "filessq" on "budget"."id" = "filessq"."budget_id" left join "notessq" on "budget"."id" = "notessq"."budget_id" left join "reminderssq" on "budget"."id" = "reminderssq"."budget_id" group by "budget"."id");--> statement-breakpoint
CREATE VIEW "public"."category_view" AS (with "filessq" as (select "associated_info"."category_id", count("files"."id") as "file_count" from "files" left join "associated_info" on "files"."associated_info_id" = "associated_info"."id" where "associated_info"."category_id" is not null group by "associated_info"."category_id"), "notessq" as (select "associated_info"."category_id", count("notes"."id") as "note_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where "associated_info"."category_id" is not null group by "associated_info"."category_id"), "reminderssq" as (select "associated_info"."category_id", count("notes"."id") as "reminder_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where ("notes"."type" = 'reminder' and "associated_info"."category_id" is not null) group by "associated_info"."category_id") select "category"."id", "category"."import_id", "category"."category_import_detail_id", "category"."title", "category"."group", "category"."single", "category"."status", "category"."active", "category"."disabled", "category"."allow_update", "category"."created_at", "category"."updated_at", sum(CASE WHEN "account"."type" IN ('asset', 'liability') THEN "journal_entry"."amount" ELSE 0 END) as "sum", count(CASE WHEN "account"."type" IN ('asset', 'liability') THEN 1 ELSE NULL END) as "count", min("journal_entry"."date") as "firstDate", max("journal_entry"."date") as "lastDate", max("note_count") as "note_count", max("reminder_count") as "reminder_count", max("file_count") as "file_count" from "category" left join "journal_entry" on "category"."id" = "journal_entry"."category_id" left join "account" on "journal_entry"."account_id" = "account"."id" left join "filessq" on "category"."id" = "filessq"."category_id" left join "notessq" on "category"."id" = "notessq"."category_id" left join "reminderssq" on "category"."id" = "reminderssq"."category_id" group by "category"."id");--> statement-breakpoint
CREATE VIEW "public"."import_check_view" AS (select "id", "created_at", "relation_id", "relation_2_id", processed_info->'dataToUse'->>'description' as "description" from "import_item_detail" where (processed_info->'dataToUse'->>'description' is not null and ("import_item_detail"."relation_id" is not null or "import_item_detail"."relation_2_id" is not null)));--> statement-breakpoint
CREATE VIEW "public"."journal_view" AS (with "filessq" as (select "associated_info"."transaction_id", count("files"."id") as "file_count" from "files" left join "associated_info" on "files"."associated_info_id" = "associated_info"."id" where "associated_info"."transaction_id" is not null group by "associated_info"."transaction_id"), "notessq" as (select "associated_info"."transaction_id", count("notes"."id") as "note_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where "associated_info"."transaction_id" is not null group by "associated_info"."transaction_id"), "reminderssq" as (select "associated_info"."transaction_id", count("notes"."id") as "reminder_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where ("notes"."type" = 'reminder' and "associated_info"."transaction_id" is not null) group by "associated_info"."transaction_id") select "journal_entry"."id", "journal_entry"."import_id", "journal_entry"."import_detail_id", "journal_entry"."unique_id", "journal_entry"."amount", "transaction"."id" as "transaction_id", "journal_entry"."description", "journal_entry"."date", "journal_entry"."date_text", "journal_entry"."tag_id", "journal_entry"."bill_id", "journal_entry"."budget_id", "journal_entry"."category_id", "journal_entry"."account_id", "journal_entry"."year_month_day", "journal_entry"."year_week", "journal_entry"."year_month", "journal_entry"."year_quarter", "journal_entry"."year", "journal_entry"."linked", "journal_entry"."reconciled", "journal_entry"."data_checked", "journal_entry"."complete", "journal_entry"."transfer", "journal_entry"."created_at", "journal_entry"."updated_at", "account"."title", "account"."type", "account"."is_cash", "account"."is_net_worth", "account"."is_catchall", "account"."account_group", "account"."account_group_2", "account"."account_group_3", "account"."account_group_combined", "account"."account_title_combined", "account"."start_date", "account"."end_date", "account"."status" as "account_status", "account"."active" as "account_active", "account"."disabled" as "account_disabled", "account"."allow_update" as "account_allow_update", "bill"."title" as "bill_title", "bill"."status" as "bill_status", "bill"."active" as "bill_active", "bill"."disabled" as "bill_disabled", "bill"."allow_update" as "bill_allow_update", "budget"."title" as "budget_title", "budget"."status" as "budget_status", "budget"."active" as "budget_active", "budget"."disabled" as "budget_disabled", "budget"."allow_update" as "budget_allow_update", "category"."title" as "category_title", "category"."group" as "category_group", "category"."single" as "category_single", "category"."status" as "category_status", "category"."active" as "category_active", "category"."disabled" as "category_disabled", "category"."allow_update" as "category_allow_update", "tag"."title" as "tag_title", "tag"."group" as "tag_group", "tag"."single" as "tag_single", "tag"."status" as "tag_status", "tag"."active" as "tag_active", "tag"."disabled" as "tag_disabled", "tag"."allow_update" as "tag_allow_update", "import"."title" as "import_title", "note_count", "reminder_count", "file_count", true as "all" from "journal_entry" left join "transaction" on "journal_entry"."transaction_id" = "transaction"."id" left join "account" on "journal_entry"."account_id" = "account"."id" left join "bill" on "journal_entry"."bill_id" = "bill"."id" left join "budget" on "journal_entry"."budget_id" = "budget"."id" left join "category" on "journal_entry"."category_id" = "category"."id" left join "tag" on "journal_entry"."tag_id" = "tag"."id" left join "import" on "journal_entry"."import_id" = "import"."id" left join "filessq" on "journal_entry"."transaction_id" = "filessq"."transaction_id" left join "notessq" on "journal_entry"."transaction_id" = "notessq"."transaction_id" left join "reminderssq" on "journal_entry"."transaction_id" = "reminderssq"."transaction_id");--> statement-breakpoint
CREATE VIEW "public"."label_view" AS (with "filessq" as (select "associated_info"."label_id", count("files"."id") as "file_count" from "files" left join "associated_info" on "files"."associated_info_id" = "associated_info"."id" where "associated_info"."label_id" is not null group by "associated_info"."label_id"), "notessq" as (select "associated_info"."label_id", count("notes"."id") as "note_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where "associated_info"."label_id" is not null group by "associated_info"."label_id"), "reminderssq" as (select "associated_info"."label_id", count("notes"."id") as "reminder_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where ("notes"."type" = 'reminder' and "associated_info"."label_id" is not null) group by "associated_info"."label_id") select "label"."id", "label"."import_id", "label"."label_import_detail_id", "label"."title", "label"."status", "label"."active", "label"."disabled", "label"."allow_update", "label"."created_at", "label"."updated_at", sum(CASE WHEN "account"."type" IN ('asset', 'liability') THEN "journal_entry"."amount" ELSE 0 END) as "sum", count(CASE WHEN "account"."type" IN ('asset', 'liability') THEN 1 ELSE NULL END) as "count", min("journal_entry"."date") as "firstDate", max("journal_entry"."date") as "lastDate", max("note_count") as "note_count", max("reminder_count") as "reminder_count", max("file_count") as "file_count" from "label" left join "labels_to_journals" on "label"."id" = "labels_to_journals"."label_id" left join "journal_entry" on "labels_to_journals"."journal_id" = "journal_entry"."id" left join "account" on "journal_entry"."account_id" = "account"."id" left join "filessq" on "label"."id" = "filessq"."label_id" left join "notessq" on "label"."id" = "notessq"."label_id" left join "reminderssq" on "label"."id" = "reminderssq"."label_id" group by "label"."id");--> statement-breakpoint
CREATE VIEW "public"."tag_view" AS (with "filessq" as (select "associated_info"."tag_id", count("files"."id") as "file_count" from "files" left join "associated_info" on "files"."associated_info_id" = "associated_info"."id" where "associated_info"."tag_id" is not null group by "associated_info"."tag_id"), "notessq" as (select "associated_info"."tag_id", count("notes"."id") as "note_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where "associated_info"."tag_id" is not null group by "associated_info"."tag_id"), "reminderssq" as (select "associated_info"."tag_id", count("notes"."id") as "reminder_count" from "notes" left join "associated_info" on "notes"."associated_info_id" = "associated_info"."id" where ("notes"."type" = 'reminder' and "associated_info"."tag_id" is not null) group by "associated_info"."tag_id") select "tag"."id", "tag"."import_id", "tag"."tag_import_detail_id", "tag"."title", "tag"."group", "tag"."single", "tag"."status", "tag"."active", "tag"."disabled", "tag"."allow_update", "tag"."created_at", "tag"."updated_at", sum(CASE WHEN "account"."type" IN ('asset', 'liability') THEN "journal_entry"."amount" ELSE 0 END) as "sum", count(CASE WHEN "account"."type" IN ('asset', 'liability') THEN 1 ELSE NULL END) as "count", min("journal_entry"."date") as "firstDate", max("journal_entry"."date") as "lastDate", max("note_count") as "note_count", max("reminder_count") as "reminder_count", max("file_count") as "file_count" from "tag" left join "journal_entry" on "tag"."id" = "journal_entry"."tag_id" left join "account" on "journal_entry"."account_id" = "account"."id" left join "filessq" on "tag"."id" = "filessq"."tag_id" left join "notessq" on "tag"."id" = "notessq"."tag_id" left join "reminderssq" on "tag"."id" = "reminderssq"."tag_id" group by "tag"."id");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."account_materialized_view" AS (select "id", "import_id", "account_import_detail_id", "title", "type", "is_cash", "is_net_worth", "is_catchall", "account_group", "account_group_2", "account_group_3", "account_group_combined", "account_title_combined", "start_date", "end_date", "status", "active", "disabled", "allow_update", "created_at", "updated_at", "sum", "count", "firstDate", "lastDate", "note_count", "reminder_count", "file_count" from "account_view");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."bill_materialized_view" AS (select "id", "import_id", "bill_import_detail_id", "title", "status", "active", "disabled", "allow_update", "created_at", "updated_at", "sum", "count", "firstDate", "lastDate", "note_count", "reminder_count", "file_count" from "bill_view");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."budget_materialized_view" AS (select "id", "import_id", "budget_import_detail_id", "title", "status", "active", "disabled", "allow_update", "created_at", "updated_at", "sum", "count", "firstDate", "lastDate", "note_count", "reminder_count", "file_count" from "budget_view");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."category_materialized_view" AS (select "id", "import_id", "category_import_detail_id", "title", "group", "single", "status", "active", "disabled", "allow_update", "created_at", "updated_at", "sum", "count", "firstDate", "lastDate", "note_count", "reminder_count", "file_count" from "category_view");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."date_range_materialized_view" AS (select min("date") as "minDate", max("date") as "maxDate" from "journal_entry");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."import_check_materialized_view" AS (select "id", "created_at", "relation_id", "relation_2_id", "description" from "import_check_view");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."journal_extended_view" AS (select "id", "import_id", "import_detail_id", "unique_id", "amount", "transaction_id", "description", "date", "date_text", "tag_id", "bill_id", "budget_id", "category_id", "account_id", "year_month_day", "year_week", "year_month", "year_quarter", "year", "linked", "reconciled", "data_checked", "complete", "transfer", "created_at", "updated_at", "title", "type", "is_cash", "is_net_worth", "is_catchall", "account_group", "account_group_2", "account_group_3", "account_group_combined", "account_title_combined", "start_date", "end_date", "account_status", "account_active", "account_disabled", "account_allow_update", "bill_title", "bill_status", "bill_active", "bill_disabled", "bill_allow_update", "budget_title", "budget_status", "budget_active", "budget_disabled", "budget_allow_update", "category_title", "category_group", "category_single", "category_status", "category_active", "category_disabled", "category_allow_update", "tag_title", "tag_group", "tag_single", "tag_status", "tag_active", "tag_disabled", "tag_allow_update", "import_title", "note_count", "reminder_count", "file_count", "all" from "journal_view");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."label_materialized_view" AS (select "id", "import_id", "label_import_detail_id", "title", "status", "active", "disabled", "allow_update", "created_at", "updated_at", "sum", "count", "firstDate", "lastDate", "note_count", "reminder_count", "file_count" from "label_view");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."tag_materialized_view" AS (select "id", "import_id", "tag_import_detail_id", "title", "group", "single", "status", "active", "disabled", "allow_update", "created_at", "updated_at", "sum", "count", "firstDate", "lastDate", "note_count", "reminder_count", "file_count" from "tag_view");
DROP INDEX IF EXISTS "materialized_journal_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_account_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_bill_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_budget_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_category_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_tag_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_label_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_import_check_view_index"; --> statement-breakpoint 
DROP INDEX IF EXISTS "materialized_import_check_description_index"; --> statement-breakpoint 
DROP MATERIALIZED VIEW IF EXISTS "import_check_materialized_view"; --> statement-breakpoint 
DROP MATERIALIZED VIEW IF EXISTS "date_range_materialized_view"; --> statement-breakpoint 
DROP MATERIALIZED VIEW IF EXISTS "label_materialized_view"; --> statement-breakpoint 
DROP MATERIALIZED VIEW IF EXISTS "category_materialized_view"; --> statement-breakpoint 
DROP MATERIALIZED VIEW IF EXISTS "budget_materialized_view"; --> statement-breakpoint 
DROP MATERIALIZED VIEW IF EXISTS "bill_materialized_view"; --> statement-breakpoint 
DROP MATERIALIZED VIEW IF EXISTS "tag_materialized_view"; --> statement-breakpoint 
DROP MATERIALIZED VIEW IF EXISTS "account_materialized_view"; --> statement-breakpoint 
DROP MATERIALIZED VIEW IF EXISTS "journal_extended_view"; --> statement-breakpoint 

DROP VIEW IF EXISTS "import_check_view"; --> statement-breakpoint 
DROP VIEW IF EXISTS "label_view"; --> statement-breakpoint 
DROP VIEW IF EXISTS "category_view"; --> statement-breakpoint 
DROP VIEW IF EXISTS "budget_view"; --> statement-breakpoint 
DROP VIEW IF EXISTS "bill_view"; --> statement-breakpoint 
DROP VIEW IF EXISTS "tag_view"; --> statement-breakpoint 
DROP VIEW IF EXISTS "account_view"; --> statement-breakpoint 
DROP VIEW IF EXISTS "journal_view"; --> statement-breakpoint 

CREATE VIEW "import_check_view" AS
SELECT
  "id",
  "created_at",
  "relation_id",
  "relation_2_id",
  PROCESSED_INFO -> 'dataToUse' ->> 'description' AS "description"
FROM
  "import_item_detail"
WHERE
  (
    PROCESSED_INFO -> 'dataToUse' ->> 'description' IS NOT NULL
    AND (
      "import_item_detail"."relation_id" IS NOT NULL
      OR "import_item_detail"."relation_2_id" IS NOT NULL
    )
  ); --> statement-breakpoint 

CREATE VIEW "label_view" AS
WITH
  "filessq" AS (
    SELECT
      "associated_info"."label_id",
      COUNT("files"."id") AS "file_count"
    FROM
      "files"
      LEFT JOIN "associated_info" ON "files"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."label_id" IS NOT NULL
    GROUP BY
      "associated_info"."label_id"
  ),
  "notessq" AS (
    SELECT
      "associated_info"."label_id",
      COUNT("notes"."id") AS "note_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."label_id" IS NOT NULL
    GROUP BY
      "associated_info"."label_id"
  ),
  "reminderssq" AS (
    SELECT
      "associated_info"."label_id",
      COUNT("notes"."id") AS "reminder_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      (
        "notes"."type" = 'reminder'
        AND "associated_info"."label_id" IS NOT NULL
      )
    GROUP BY
      "associated_info"."label_id"
  )
SELECT
  "label"."id",
  "label"."import_id",
  "label"."label_import_detail_id",
  "label"."title",
  "label"."status",
  "label"."active",
  "label"."disabled",
  "label"."allow_update",
  "label"."created_at",
  "label"."updated_at",
  SUM(
    CASE
      WHEN "account"."type" IN ('asset', 'liability') THEN "journal_entry"."amount"
      ELSE 0
    END
  ) AS "sum",
  COUNT(
    CASE
      WHEN "account"."type" IN ('asset', 'liability') THEN 1
      ELSE NULL
    END
  ) AS "count",
  MIN("journal_entry"."date") AS "firstDate",
  MAX("journal_entry"."date") AS "lastDate",
  MAX("note_count") AS "note_count",
  MAX("reminder_count") AS "reminder_count",
  MAX("file_count") AS "file_count"
FROM
  "label"
  LEFT JOIN "labels_to_journals" ON "label"."id" = "labels_to_journals"."label_id"
  LEFT JOIN "journal_entry" ON "labels_to_journals"."journal_id" = "journal_entry"."id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
  LEFT JOIN "filessq" ON "label"."id" = "filessq"."label_id"
  LEFT JOIN "notessq" ON "label"."id" = "notessq"."label_id"
  LEFT JOIN "reminderssq" ON "label"."id" = "reminderssq"."label_id"
GROUP BY
  "label"."id"; --> statement-breakpoint 

CREATE VIEW "category_view" AS
WITH
  "filessq" AS (
    SELECT
      "associated_info"."category_id",
      COUNT("files"."id") AS "file_count"
    FROM
      "files"
      LEFT JOIN "associated_info" ON "files"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."category_id" IS NOT NULL
    GROUP BY
      "associated_info"."category_id"
  ),
  "notessq" AS (
    SELECT
      "associated_info"."category_id",
      COUNT("notes"."id") AS "note_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."category_id" IS NOT NULL
    GROUP BY
      "associated_info"."category_id"
  ),
  "reminderssq" AS (
    SELECT
      "associated_info"."category_id",
      COUNT("notes"."id") AS "reminder_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      (
        "notes"."type" = 'reminder'
        AND "associated_info"."category_id" IS NOT NULL
      )
    GROUP BY
      "associated_info"."category_id"
  )
SELECT
  "category"."id",
  "category"."import_id",
  "category"."category_import_detail_id",
  "category"."title",
  "category"."group",
  "category"."single",
  "category"."status",
  "category"."active",
  "category"."disabled",
  "category"."allow_update",
  "category"."created_at",
  "category"."updated_at",
  SUM(
    CASE
      WHEN "account"."type" IN ('asset', 'liability') THEN "journal_entry"."amount"
      ELSE 0
    END
  ) AS "sum",
  COUNT(
    CASE
      WHEN "account"."type" IN ('asset', 'liability') THEN 1
      ELSE NULL
    END
  ) AS "count",
  MIN("journal_entry"."date") AS "firstDate",
  MAX("journal_entry"."date") AS "lastDate",
  MAX("note_count") AS "note_count",
  MAX("reminder_count") AS "reminder_count",
  MAX("file_count") AS "file_count"
FROM
  "category"
  LEFT JOIN "journal_entry" ON "category"."id" = "journal_entry"."category_id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
  LEFT JOIN "filessq" ON "category"."id" = "filessq"."category_id"
  LEFT JOIN "notessq" ON "category"."id" = "notessq"."category_id"
  LEFT JOIN "reminderssq" ON "category"."id" = "reminderssq"."category_id"
GROUP BY
  "category"."id"; --> statement-breakpoint 

CREATE VIEW "budget_view" AS
WITH
  "filessq" AS (
    SELECT
      "associated_info"."budget_id",
      COUNT("files"."id") AS "file_count"
    FROM
      "files"
      LEFT JOIN "associated_info" ON "files"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."budget_id" IS NOT NULL
    GROUP BY
      "associated_info"."budget_id"
  ),
  "notessq" AS (
    SELECT
      "associated_info"."budget_id",
      COUNT("notes"."id") AS "note_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."budget_id" IS NOT NULL
    GROUP BY
      "associated_info"."budget_id"
  ),
  "reminderssq" AS (
    SELECT
      "associated_info"."budget_id",
      COUNT("notes"."id") AS "reminder_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      (
        "notes"."type" = 'reminder'
        AND "associated_info"."budget_id" IS NOT NULL
      )
    GROUP BY
      "associated_info"."budget_id"
  )
SELECT
  "budget"."id",
  "budget"."import_id",
  "budget"."budget_import_detail_id",
  "budget"."title",
  "budget"."status",
  "budget"."active",
  "budget"."disabled",
  "budget"."allow_update",
  "budget"."created_at",
  "budget"."updated_at",
  SUM(
    CASE
      WHEN "account"."type" IN ('asset', 'liability') THEN "journal_entry"."amount"
      ELSE 0
    END
  ) AS "sum",
  COUNT(
    CASE
      WHEN "account"."type" IN ('asset', 'liability') THEN 1
      ELSE NULL
    END
  ) AS "count",
  MIN("journal_entry"."date") AS "firstDate",
  MAX("journal_entry"."date") AS "lastDate",
  MAX("note_count") AS "note_count",
  MAX("reminder_count") AS "reminder_count",
  MAX("file_count") AS "file_count"
FROM
  "budget"
  LEFT JOIN "journal_entry" ON "budget"."id" = "journal_entry"."budget_id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
  LEFT JOIN "filessq" ON "budget"."id" = "filessq"."budget_id"
  LEFT JOIN "notessq" ON "budget"."id" = "notessq"."budget_id"
  LEFT JOIN "reminderssq" ON "budget"."id" = "reminderssq"."budget_id"
GROUP BY
  "budget"."id"; --> statement-breakpoint 

CREATE VIEW "bill_view" AS
WITH
  "filessq" AS (
    SELECT
      "associated_info"."bill_id",
      COUNT("files"."id") AS "file_count"
    FROM
      "files"
      LEFT JOIN "associated_info" ON "files"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."bill_id" IS NOT NULL
    GROUP BY
      "associated_info"."bill_id"
  ),
  "notessq" AS (
    SELECT
      "associated_info"."bill_id",
      COUNT("notes"."id") AS "note_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."bill_id" IS NOT NULL
    GROUP BY
      "associated_info"."bill_id"
  ),
  "reminderssq" AS (
    SELECT
      "associated_info"."bill_id",
      COUNT("notes"."id") AS "reminder_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      (
        "notes"."type" = 'reminder'
        AND "associated_info"."bill_id" IS NOT NULL
      )
    GROUP BY
      "associated_info"."bill_id"
  )
SELECT
  "bill"."id",
  "bill"."import_id",
  "bill"."bill_import_detail_id",
  "bill"."title",
  "bill"."status",
  "bill"."active",
  "bill"."disabled",
  "bill"."allow_update",
  "bill"."created_at",
  "bill"."updated_at",
  SUM(
    CASE
      WHEN "account"."type" IN ('asset', 'liability') THEN "journal_entry"."amount"
      ELSE 0
    END
  ) AS "sum",
  COUNT(
    CASE
      WHEN "account"."type" IN ('asset', 'liability') THEN 1
      ELSE NULL
    END
  ) AS "count",
  MIN("journal_entry"."date") AS "firstDate",
  MAX("journal_entry"."date") AS "lastDate",
  MAX("note_count") AS "note_count",
  MAX("reminder_count") AS "reminder_count",
  MAX("file_count") AS "file_count"
FROM
  "bill"
  LEFT JOIN "journal_entry" ON "bill"."id" = "journal_entry"."bill_id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
  LEFT JOIN "filessq" ON "bill"."id" = "filessq"."bill_id"
  LEFT JOIN "notessq" ON "bill"."id" = "notessq"."bill_id"
  LEFT JOIN "reminderssq" ON "bill"."id" = "reminderssq"."bill_id"
GROUP BY
  "bill"."id"; --> statement-breakpoint 

CREATE VIEW "tag_view" AS
WITH
  "filessq" AS (
    SELECT
      "associated_info"."tag_id",
      COUNT("files"."id") AS "file_count"
    FROM
      "files"
      LEFT JOIN "associated_info" ON "files"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."tag_id" IS NOT NULL
    GROUP BY
      "associated_info"."tag_id"
  ),
  "notessq" AS (
    SELECT
      "associated_info"."tag_id",
      COUNT("notes"."id") AS "note_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."tag_id" IS NOT NULL
    GROUP BY
      "associated_info"."tag_id"
  ),
  "reminderssq" AS (
    SELECT
      "associated_info"."tag_id",
      COUNT("notes"."id") AS "reminder_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      (
        "notes"."type" = 'reminder'
        AND "associated_info"."tag_id" IS NOT NULL
      )
    GROUP BY
      "associated_info"."tag_id"
  )
SELECT
  "tag"."id",
  "tag"."import_id",
  "tag"."tag_import_detail_id",
  "tag"."title",
  "tag"."group",
  "tag"."single",
  "tag"."status",
  "tag"."active",
  "tag"."disabled",
  "tag"."allow_update",
  "tag"."created_at",
  "tag"."updated_at",
  SUM(
    CASE
      WHEN "account"."type" IN ('asset', 'liability') THEN "journal_entry"."amount"
      ELSE 0
    END
  ) AS "sum",
  COUNT(
    CASE
      WHEN "account"."type" IN ('asset', 'liability') THEN 1
      ELSE NULL
    END
  ) AS "count",
  MIN("journal_entry"."date") AS "firstDate",
  MAX("journal_entry"."date") AS "lastDate",
  MAX("note_count") AS "note_count",
  MAX("reminder_count") AS "reminder_count",
  MAX("file_count") AS "file_count"
FROM
  "tag"
  LEFT JOIN "journal_entry" ON "tag"."id" = "journal_entry"."tag_id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
  LEFT JOIN "filessq" ON "tag"."id" = "filessq"."tag_id"
  LEFT JOIN "notessq" ON "tag"."id" = "notessq"."tag_id"
  LEFT JOIN "reminderssq" ON "tag"."id" = "reminderssq"."tag_id"
GROUP BY
  "tag"."id"; --> statement-breakpoint 

CREATE VIEW "account_view" AS
WITH
  "filessq" AS (
    SELECT
      "associated_info"."account_id",
      COUNT("files"."id") AS "file_count"
    FROM
      "files"
      LEFT JOIN "associated_info" ON "files"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."account_id" IS NOT NULL
    GROUP BY
      "associated_info"."account_id"
  ),
  "notessq" AS (
    SELECT
      "associated_info"."account_id",
      COUNT("notes"."id") AS "note_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."account_id" IS NOT NULL
    GROUP BY
      "associated_info"."account_id"
  ),
  "reminderssq" AS (
    SELECT
      "associated_info"."account_id",
      COUNT("notes"."id") AS "reminder_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      (
        "notes"."type" = 'reminder'
        AND "associated_info"."account_id" IS NOT NULL
      )
    GROUP BY
      "associated_info"."account_id"
  )
SELECT
  "account"."id",
  "account"."import_id",
  "account"."account_import_detail_id",
  "account"."title",
  "account"."type",
  "account"."is_cash",
  "account"."is_net_worth",
  "account"."account_group",
  "account"."account_group_2",
  "account"."account_group_3",
  "account"."account_group_combined",
  "account"."account_title_combined",
  "account"."start_date",
  "account"."end_date",
  "account"."status",
  "account"."active",
  "account"."disabled",
  "account"."allow_update",
  "account"."created_at",
  "account"."updated_at",
  SUM("journal_entry"."amount") AS "sum",
  COUNT("journal_entry"."id") AS "count",
  MIN("journal_entry"."date") AS "firstDate",
  MAX("journal_entry"."date") AS "lastDate",
  MAX("note_count") AS "note_count",
  MAX("reminder_count") AS "reminder_count",
  MAX("file_count") AS "file_count"
FROM
  "account"
  LEFT JOIN "journal_entry" ON "account"."id" = "journal_entry"."account_id"
  LEFT JOIN "import" ON "journal_entry"."import_id" = "import"."id"
  LEFT JOIN "filessq" ON "account"."id" = "filessq"."account_id"
  LEFT JOIN "notessq" ON "account"."id" = "notessq"."account_id"
  LEFT JOIN "reminderssq" ON "account"."id" = "reminderssq"."account_id"
GROUP BY
  "account"."id"; --> statement-breakpoint 

CREATE VIEW "journal_view" AS
WITH
  "filessq" AS (
    SELECT
      "associated_info"."transaction_id",
      COUNT("files"."id") AS "file_count"
    FROM
      "files"
      LEFT JOIN "associated_info" ON "files"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."transaction_id" IS NOT NULL
    GROUP BY
      "associated_info"."transaction_id"
  ),
  "notessq" AS (
    SELECT
      "associated_info"."transaction_id",
      COUNT("notes"."id") AS "note_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      "associated_info"."transaction_id" IS NOT NULL
    GROUP BY
      "associated_info"."transaction_id"
  ),
  "reminderssq" AS (
    SELECT
      "associated_info"."transaction_id",
      COUNT("notes"."id") AS "reminder_count"
    FROM
      "notes"
      LEFT JOIN "associated_info" ON "notes"."associated_info_id" = "associated_info"."id"
    WHERE
      (
        "notes"."type" = 'reminder'
        AND "associated_info"."transaction_id" IS NOT NULL
      )
    GROUP BY
      "associated_info"."transaction_id"
  )
SELECT
  "journal_entry"."id",
  "journal_entry"."import_id",
  "journal_entry"."import_detail_id",
  "journal_entry"."unique_id",
  "journal_entry"."amount",
  "transaction"."id" AS "transaction_id",
  "journal_entry"."description",
  "journal_entry"."date",
  "journal_entry"."date_text",
  "journal_entry"."tag_id",
  "journal_entry"."bill_id",
  "journal_entry"."budget_id",
  "journal_entry"."category_id",
  "journal_entry"."account_id",
  "journal_entry"."year_month_day",
  "journal_entry"."year_week",
  "journal_entry"."year_month",
  "journal_entry"."year_quarter",
  "journal_entry"."year",
  "journal_entry"."linked",
  "journal_entry"."reconciled",
  "journal_entry"."data_checked",
  "journal_entry"."complete",
  "journal_entry"."transfer",
  "journal_entry"."created_at",
  "journal_entry"."updated_at",
  "account"."title",
  "account"."type",
  "account"."is_cash",
  "account"."is_net_worth",
  "account"."account_group",
  "account"."account_group_2",
  "account"."account_group_3",
  "account"."account_group_combined",
  "account"."account_title_combined",
  "account"."start_date",
  "account"."end_date",
  "account"."status" AS "account_status",
  "account"."active" AS "account_active",
  "account"."disabled" AS "account_disabled",
  "account"."allow_update" AS "account_allow_update",
  "bill"."title" AS "bill_title",
  "bill"."status" AS "bill_status",
  "bill"."active" AS "bill_active",
  "bill"."disabled" AS "bill_disabled",
  "bill"."allow_update" AS "bill_allow_update",
  "budget"."title" AS "budget_title",
  "budget"."status" AS "budget_status",
  "budget"."active" AS "budget_active",
  "budget"."disabled" AS "budget_disabled",
  "budget"."allow_update" AS "budget_allow_update",
  "category"."title" AS "category_title",
  "category"."group" AS "category_group",
  "category"."single" AS "category_single",
  "category"."status" AS "category_status",
  "category"."active" AS "category_active",
  "category"."disabled" AS "category_disabled",
  "category"."allow_update" AS "category_allow_update",
  "tag"."title" AS "tag_title",
  "tag"."group" AS "tag_group",
  "tag"."single" AS "tag_single",
  "tag"."status" AS "tag_status",
  "tag"."active" AS "tag_active",
  "tag"."disabled" AS "tag_disabled",
  "tag"."allow_update" AS "tag_allow_update",
  "import"."title" AS "import_title",
  "note_count",
  "reminder_count",
  "file_count",
  TRUE AS "all"
FROM
  "journal_entry"
  LEFT JOIN "transaction" ON "journal_entry"."transaction_id" = "transaction"."id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
  LEFT JOIN "bill" ON "journal_entry"."bill_id" = "bill"."id"
  LEFT JOIN "budget" ON "journal_entry"."budget_id" = "budget"."id"
  LEFT JOIN "category" ON "journal_entry"."category_id" = "category"."id"
  LEFT JOIN "tag" ON "journal_entry"."tag_id" = "tag"."id"
  LEFT JOIN "import" ON "journal_entry"."import_id" = "import"."id"
  LEFT JOIN "filessq" ON "journal_entry"."transaction_id" = "filessq"."transaction_id"
  LEFT JOIN "notessq" ON "journal_entry"."transaction_id" = "notessq"."transaction_id"
  LEFT JOIN "reminderssq" ON "journal_entry"."transaction_id" = "reminderssq"."transaction_id"; --> statement-breakpoint 

CREATE MATERIALIZED VIEW "import_check_materialized_view" AS
SELECT
  "id",
  "created_at",
  "relation_id",
  "relation_2_id",
  "description"
FROM
  "import_check_view"; --> statement-breakpoint 

CREATE MATERIALIZED VIEW "date_range_materialized_view" AS
SELECT
  MIN("date") AS "minDate",
  MAX("date") AS "maxDate"
FROM
  "journal_entry"; --> statement-breakpoint 

CREATE MATERIALIZED VIEW "label_materialized_view" AS
SELECT
  "id",
  "import_id",
  "label_import_detail_id",
  "title",
  "status",
  "active",
  "disabled",
  "allow_update",
  "created_at",
  "updated_at",
  "sum",
  "count",
  "firstDate",
  "lastDate",
  "note_count",
  "reminder_count",
  "file_count"
FROM
  "label_view"; --> statement-breakpoint 

CREATE MATERIALIZED VIEW "category_materialized_view" AS
SELECT
  "id",
  "import_id",
  "category_import_detail_id",
  "title",
  "group",
  "single",
  "status",
  "active",
  "disabled",
  "allow_update",
  "created_at",
  "updated_at",
  "sum",
  "count",
  "firstDate",
  "lastDate",
  "note_count",
  "reminder_count",
  "file_count"
FROM
  "category_view"; --> statement-breakpoint 

CREATE MATERIALIZED VIEW "budget_materialized_view" AS
SELECT
  "id",
  "import_id",
  "budget_import_detail_id",
  "title",
  "status",
  "active",
  "disabled",
  "allow_update",
  "created_at",
  "updated_at",
  "sum",
  "count",
  "firstDate",
  "lastDate",
  "note_count",
  "reminder_count",
  "file_count"
FROM
  "budget_view"; --> statement-breakpoint 

CREATE MATERIALIZED VIEW "bill_materialized_view" AS
SELECT
  "id",
  "import_id",
  "bill_import_detail_id",
  "title",
  "status",
  "active",
  "disabled",
  "allow_update",
  "created_at",
  "updated_at",
  "sum",
  "count",
  "firstDate",
  "lastDate",
  "note_count",
  "reminder_count",
  "file_count"
FROM
  "bill_view"; --> statement-breakpoint 

CREATE MATERIALIZED VIEW "tag_materialized_view" AS
SELECT
  "id",
  "import_id",
  "tag_import_detail_id",
  "title",
  "group",
  "single",
  "status",
  "active",
  "disabled",
  "allow_update",
  "created_at",
  "updated_at",
  "sum",
  "count",
  "firstDate",
  "lastDate",
  "note_count",
  "reminder_count",
  "file_count"
FROM
  "tag_view"; --> statement-breakpoint 

CREATE MATERIALIZED VIEW "account_materialized_view" AS
SELECT
  "id",
  "import_id",
  "account_import_detail_id",
  "title",
  "type",
  "is_cash",
  "is_net_worth",
  "account_group",
  "account_group_2",
  "account_group_3",
  "account_group_combined",
  "account_title_combined",
  "start_date",
  "end_date",
  "status",
  "active",
  "disabled",
  "allow_update",
  "created_at",
  "updated_at",
  "sum",
  "count",
  "firstDate",
  "lastDate",
  "note_count",
  "reminder_count",
  "file_count"
FROM
  "account_view"; --> statement-breakpoint 

CREATE MATERIALIZED VIEW "journal_extended_view" AS
SELECT
  "id",
  "import_id",
  "import_detail_id",
  "unique_id",
  "amount",
  "transaction_id",
  "description",
  "date",
  "date_text",
  "tag_id",
  "bill_id",
  "budget_id",
  "category_id",
  "account_id",
  "year_month_day",
  "year_week",
  "year_month",
  "year_quarter",
  "year",
  "linked",
  "reconciled",
  "data_checked",
  "complete",
  "transfer",
  "created_at",
  "updated_at",
  "title",
  "type",
  "is_cash",
  "is_net_worth",
  "account_group",
  "account_group_2",
  "account_group_3",
  "account_group_combined",
  "account_title_combined",
  "start_date",
  "end_date",
  "account_status",
  "account_active",
  "account_disabled",
  "account_allow_update",
  "bill_title",
  "bill_status",
  "bill_active",
  "bill_disabled",
  "bill_allow_update",
  "budget_title",
  "budget_status",
  "budget_active",
  "budget_disabled",
  "budget_allow_update",
  "category_title",
  "category_group",
  "category_single",
  "category_status",
  "category_active",
  "category_disabled",
  "category_allow_update",
  "tag_title",
  "tag_group",
  "tag_single",
  "tag_status",
  "tag_active",
  "tag_disabled",
  "tag_allow_update",
  "import_title",
  "note_count",
  "reminder_count",
  "file_count",
  "all"
FROM
  "journal_view"; --> statement-breakpoint 

CREATE UNIQUE INDEX IF NOT EXISTS "materialized_journal_view_index" ON "journal_extended_view" ("journal_extended_view"."id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_account_view_index" ON "account_materialized_view" ("account_materialized_view"."id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_bill_view_index" ON "bill_materialized_view" ("bill_materialized_view"."id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_budget_view_index" ON "budget_materialized_view" ("budget_materialized_view"."id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_category_view_index" ON "category_materialized_view" ("category_materialized_view"."id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_tag_view_index" ON "tag_materialized_view" ("tag_materialized_view"."id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_label_view_index" ON "label_materialized_view" ("label_materialized_view"."id"); --> statement-breakpoint 
CREATE UNIQUE INDEX IF NOT EXISTS "materialized_import_check_view_index" ON "import_check_materialized_view" ("import_check_materialized_view"."id"); --> statement-breakpoint 
CREATE INDEX IF NOT EXISTS "materialized_import_check_description_index" ON "import_check_materialized_view" ("description"); --> statement-breakpoint 

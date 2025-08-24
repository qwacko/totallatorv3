drop materialized view if exists "journal_extended_view"; --> statement-breakpoint
CREATE MATERIALIZED VIEW "journal_extended_view" AS
WITH
  "filessq" AS (
    SELECT
      "transaction_id",
      COUNT("id") AS "file_count"
    FROM
      "files"
    GROUP BY
      "files"."transaction_id"
  ),
  "notessq" AS (
    SELECT
      "transaction_id",
      COUNT("id") AS "note_count"
    FROM
      "notes"
    GROUP BY
      "notes"."transaction_id"
  ),
  "reminderssq" AS (
    SELECT
      "transaction_id",
      COUNT("id") AS "reminder_count"
    FROM
      "notes"
    WHERE
      "notes"."type" = 'reminder'
    GROUP BY
      "notes"."transaction_id"
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
  LEFT JOIN "reminderssq" ON "journal_entry"."transaction_id" = "reminderssq"."transaction_id";
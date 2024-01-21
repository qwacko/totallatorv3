CREATE MATERIALIZED VIEW "label_materialized_view" AS
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
  MAX("journal_entry"."date") AS "lastDate"
FROM
  "label"
  LEFT JOIN "labels_to_journals" ON "label"."id" = "labels_to_journals"."label_id"
  LEFT JOIN "journal_entry" ON "labels_to_journals"."journal_id" = "journal_entry"."id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
GROUP BY
  "label"."id";
----------------------------------------------------------------------------------------------------

CREATE MATERIALIZED VIEW "category_materialized_view" AS
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
  MAX("journal_entry"."date") AS "lastDate"
FROM
  "category"
  LEFT JOIN "journal_entry" ON "category"."id" = "journal_entry"."category_id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
GROUP BY
  "category"."id";
----------------------------------------------------------------------------------------------------

CREATE MATERIALIZED VIEW "budget_materialized_view" AS
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
  MAX("journal_entry"."date") AS "lastDate"
FROM
  "budget"
  LEFT JOIN "journal_entry" ON "budget"."id" = "journal_entry"."budget_id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
GROUP BY
  "budget"."id";
----------------------------------------------------------------------------------------------------

CREATE MATERIALIZED VIEW "bill_materialized_view" AS
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
  MAX("journal_entry"."date") AS "lastDate"
FROM
  "bill"
  LEFT JOIN "journal_entry" ON "bill"."id" = "journal_entry"."bill_id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
GROUP BY
  "bill"."id";
----------------------------------------------------------------------------------------------------

CREATE MATERIALIZED VIEW "tag_materialized_view" AS
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
  MAX("journal_entry"."date") AS "lastDate"
FROM
  "tag"
  LEFT JOIN "journal_entry" ON "tag"."id" = "journal_entry"."tag_id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
GROUP BY
  "tag"."id";
----------------------------------------------------------------------------------------------------

CREATE MATERIALIZED VIEW "account_materialized_view" AS
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
  MAX("journal_entry"."date") AS "lastDate"
FROM
  "account"
  LEFT JOIN "journal_entry" ON "account"."id" = "journal_entry"."account_id"
GROUP BY
  "account"."id";
----------------------------------------------------------------------------------------------------

CREATE MATERIALIZED VIEW "journal_extended_view" AS
WITH
  "labelsq" AS (
    SELECT
      "labels_to_journals"."journal_id",
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'labelToJournalId',
          "labels_to_journals"."id",
          'id',
          "labels_to_journals"."label_id",
          'title',
          "label"."title"
        )
      ) AS "labelData"
    FROM
      "labels_to_journals"
      LEFT JOIN "label" ON "labels_to_journals"."label_id" = "label"."id"
    GROUP BY
      "labels_to_journals"."journal_id"
  ),
  "journalsq" AS (
    SELECT
      "journal_entry"."id",
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'id',
          "otherJournal"."id",
          'transactionId',
          "otherJournal"."transaction_id",
          'accountId',
          "account"."id",
          'accountTitle',
          "account"."title",
          'accountType',
          "account"."type",
          'accountGroup',
          "account"."account_group_combined",
          'amount',
          "otherJournal"."amount"
        )
      ) AS "otherJournalData"
    FROM
      "journal_entry"
      LEFT JOIN "journal_entry" "otherJournal" ON "otherJournal"."transaction_id" = "journal_entry"."transaction_id"
      LEFT JOIN "account" ON "otherJournal"."account_id" = "account"."id"
    WHERE
      NOT "otherJournal"."id" = "journal_entry"."id"
    GROUP BY
      "journal_entry"."id"
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
  "labelData",
  "otherJournalData"
FROM
  "journal_entry"
  LEFT JOIN "transaction" ON "journal_entry"."transaction_id" = "transaction"."id"
  LEFT JOIN "account" ON "journal_entry"."account_id" = "account"."id"
  LEFT JOIN "bill" ON "journal_entry"."bill_id" = "bill"."id"
  LEFT JOIN "budget" ON "journal_entry"."budget_id" = "budget"."id"
  LEFT JOIN "category" ON "journal_entry"."category_id" = "category"."id"
  LEFT JOIN "tag" ON "journal_entry"."tag_id" = "tag"."id"
  LEFT JOIN "import" ON "journal_entry"."import_id" = "import"."id"
  LEFT JOIN "labelsq" ON "journal_entry"."id" = "labelsq"."journal_id"
  LEFT JOIN "journalsq" ON "journal_entry"."id" = "journalsq"."id";
----------------------------------------------------------------------------------------------------


drop materialized view if exists "journal_extended_view"; --> statement-breakpoint
CREATE MATERIALIZED VIEW "journal_extended_view" AS
WITH
  "labelsq" AS (
    SELECT
      "labels_to_journals"."journal_id",
      COALESCE(
        JSONB_AGG(
          JSONB_BUILD_OBJECT(
            'labelToJournalId',
            "labels_to_journals"."id",
            'id',
            "labels_to_journals"."label_id",
            'title',
            "label"."title"
          )
        ),
        '[]'::JSONB
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
      COALESCE(
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
        ),
        '[]'::JSONB
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
  COALESCE("labelData", '[]'::JSONB) AS "labelData",
  COALESCE("otherJournalData", '[]'::JSONB) AS "otherJournalData"
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
  LEFT JOIN "journalsq" ON "journal_entry"."id" = "journalsq"."id";-- Custom SQL migration file, put you code below! --
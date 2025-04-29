-- Custom SQL migration file, put your code below! --
INSERT INTO
    "associated_info" (
        id,
        account_id,
        transaction_id,
        bill_id,
        budget_id,
        category_id,
        tag_id,
        created_at,
        updated_at,
        created_by,
        linked,
        label_id,
        auto_import_id,
        report_id,
        report_element_id
    )
SELECT
    id,
    account_id,
    transaction_id,
    bill_id,
    budget_id,
    category_id,
    tag_id,
    created_at,
    updated_at,
    created_by,
    linked,
    label_id,
    auto_import_id,
    report_id,
    report_element_id
from
    "files"
    --> statement-breakpoint
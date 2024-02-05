drop materialized view if exists "date_range_materialized_view"; --> statement-breakpoint
CREATE MATERIALIZED VIEW "date_range_materialized_view" AS
SELECT
  MIN("date") AS "minDate",
  MAX("date") AS "maxDate"
FROM
  "journal_entry";
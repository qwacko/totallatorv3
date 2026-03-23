# `@totallator/business-logic`

Business logic and orchestration for Totallator.

This package is the main server-side API layer that sits between application code and the database-focused packages. It groups domain operations into `tActions`, exposes non-mutating support utilities through `tHelpers`, and provides narrower secondary entrypoints for browser-safe and test-only use cases.

## Public Entrypoints

Only these import paths are public:

```ts
import { tActions, tHelpers } from '@totallator/business-logic';
import { clientHelpers } from '@totallator/business-logic/client';
import { createTestDatabase } from '@totallator/business-logic/testing';
```

- `@totallator/business-logic`
  Main runtime API. Server/backend use only.
- `@totallator/business-logic/client`
  Browser-safe exports. Currently limited to LLM provider metadata helpers.
- `@totallator/business-logic/testing`
  Test harness and seed utilities for DB-backed tests.

Do not deep-import from `src/...` or package subfolders. Those paths are internal implementation details.

## Mental Model

- `tActions`
  Business operations. Create, update, delete, list, import, report, auth, cron, backup, and other domain workflows.
- `tHelpers`
  Supporting helpers that describe or support business logic without being the main business mutation API. This includes filter-to-text helpers, filter-array builders, provider metadata, event bootstrap, and cron definitions.
- Root type exports
  Selected shared types used by the webapp and other packages.

If you are unsure where to start, start with `tActions`. If you need to turn UI filters into text, initialize runtime wiring, or inspect static definitions, look at `tHelpers`.

## Package Layout

```text
src/
  actions/           Domain APIs grouped into tActions
  actions/helpers/   Query builders, text/filter helpers, report/import support code
  events/            Event callback registration and backup restore progress helpers
  server/            Cron definitions, DB logger, LLM provider config, file/server utilities
  client.ts          Browser-safe entrypoint
  testing.ts         Test-only entrypoint
  tHelpers.ts        Grouped helper surface
  index.ts           Root runtime + type barrel
```

## `tActions`

`tActions` is the preferred entrypoint for business operations.

Groups:

- `account`, `bill`, `budget`, `category`, `label`, `tag`
  Core record domains. Mostly CRUD-style plus dropdown and create-or-get operations.
- `associatedInfo`, `file`, `note`
  Attachment and metadata domains used by journals and related records.
- `journal`
  Main transaction/journal workflow surface. Handles creation, mutation, completion state, cloning, and transfer reconciliation.
- `transactionChange`
  Audit/history support for transaction and journal mutations.
- `import`
  Import lifecycle orchestration. Handles file storage, processing, execution, reprocessing, and cleanup.
- `importMapping`
  Saved mapping definitions used by mapped imports.
- `reusableFilter`
  Saved/shared filters reused in UI flows.
- `report`
  Report configuration and computed report-data orchestration.
- `journalView`
  Read-oriented materialized journal view access.
- `materializedViews`
  Refresh and maintenance operations for materialized views.
- `backup`
  Backup retention, storage, metadata, and restore workflow.
- `llm`
  LLM provider settings management with encrypted API key storage.
- `journalLlmSuggestion`
  LLM-assisted journal suggestion workflows.
- `agentRun`
  Agent-run persistence and coordination APIs used by the AI package.
- `auth`, `user`
  Authentication and user/admin-oriented operations.
- `autoImport`
  Rules/configuration for automatic import discovery and triggering.
- `queryLog`
  Query-log access and grouped log views.
- `cronJob`, `cronExecution`
  Cron job configuration and execution history.

Typical shape for the CRUD-style action groups:

- `getById`
- `list`
- `count`
- `create`
- `update`
- `delete`
- `listForDropdown`
- `createOrGet`

Some groups are orchestration-heavy rather than CRUD-like:

- `journal`
- `import`
- `report`
- `backup`
- `llm`
- `journalLlmSuggestion`
- `cronJob`
- `cronExecution`

Those are usually the best places to read first when an agent needs to understand higher-level workflows.

### API Guide

This is the recommended "start here" map rather than a complete function inventory.

- `tActions.journal`
  Primary transaction creation and mutation surface.
  Start with `createFromSimpleTransaction`, `createManyTransactionJournals`, `updateJournals`, `cloneJournals`, `markManyComplete`, and `markManyUncomplete`.
  Important side effects: writes transactions/journals, updates transfer metadata, and records transaction snapshots/audit history.
- `tActions.import`
  Full import ingestion and execution pipeline.
  Start with `store`, `runImportLifecycle`, `executeImportLifecycle`, `doImport`, `reprocess`, `deleteLinked`, and `clean`.
  Important side effects: stores files, creates import details, and may create accounts, categories, labels, tags, journals, and linked records.
- `tActions.report`
  Report builder and data orchestration.
  Start with `create`, `getReportConfig`, `updateLayout`, `upsertFilter`, and the nested `reportElement*` / `filter` sub-APIs.
  Important side effects: maintains report, report-element, config, and filter records and computes report data from journal/materialized-view sources.
- `tActions.backup`
  Operationally sensitive backup workflow.
  Start with `storeBackup`, `list`, `getBackupInfo`, `restoreTrigger`, `restoreBackup`, `deleteBackup`, and `trimBackups`.
  Important side effects: writes backup artifacts, emits restore progress events, and can replace large parts of persisted application data.
- `tActions.llm`
  Provider settings management.
  Start with `create`, `list`, `getById`, `update`, and `getEnabled`.
  Important side effects: API keys are encrypted at rest and only decrypted on selected reads.
- `tActions.cronJob` / `tActions.cronExecution`
  Cron management and execution history.
  Use together with `tHelpers.cron.jobDefinitions`.
- `tActions.journalView`
  Read-oriented materialized view access.
  Prefer this over rebuilding recommendation or summary queries manually.

## `tHelpers`

`tHelpers` groups helper functionality by domain and runtime concern.

Groups:

- `account`, `bill`, `budget`, `category`, `label`, `tag`
  Domain filter-to-text and filter-array helpers used by list/search/filter UIs.
- `associatedInfo`
  Filter-to-text helper for associated-info filters.
- `file`
  File filter-array helper.
- `import`, `importMapping`
  Helpers that describe import/import-mapping filters.
- `journal`
  Date expansion, filter text conversion, filter arrays, update text conversion, materialized list access, reusable filter text, and transfer-info update support.
- `llmProvider`
  Static provider metadata helpers safe for UI and configuration code.
- `system`
  Runtime/bootstrap helpers such as DB logger setup and first-user/admin checks.
- `events`
  Event callback initialization and backup-restore progress helpers.
- `cron`
  Static cron job definitions used by the worker runtime.

Common helper patterns:

- `filterToText`
  Convert structured filters into a text description or query-oriented text.
- `filterArray`
  Build/filter text token arrays used by search or matching logic.
- `journal.updateToText`
  Convert journal update payloads into text.
- `cron.jobDefinitions`
  Static cron definitions consumed by the worker runtime.
- `events.*`
  Event callback bootstrap and backup restore progress helpers.
- `system.*`
  System/bootstrap helpers such as DB logger setup and admin-count checks.

### Helper Guide

- `tHelpers.journal`
  The most useful helper group for agent work.
  Start with `filterToText`, `filterArray`, `updateToText`, `expandDate`, and `materialisedList`.
- `tHelpers.llmProvider`
  Provider metadata lookup for UI/configuration flows.
- `tHelpers.events`
  Runtime wiring for event callbacks and restore progress. This is infrastructure-facing rather than user-facing business logic.
- `tHelpers.system`
  Small bootstrap helpers used at app startup.
- `tHelpers.cron`
  Static definitions, not execution state. Pair with `tActions.cronJob` and `tActions.cronExecution`.

## Choosing The Right API

- Need to perform a business operation: use `tActions`.
- Need to format, describe, or support a business operation: use `tHelpers`.
- Need provider metadata in browser code: use `clientHelpers`.
- Need DB test setup or test seed helpers: use `@totallator/business-logic/testing`.

## Guidance For Coding Agents

- Prefer the root barrel over importing individual action files.
- Prefer `tActions.<group>` and `tHelpers.<group>` over older flat helper/action names.
- Treat `actions/helpers/*` as implementation details unless you are changing business-logic internals.
- Check whether a domain already has a filter helper before inventing new text/query conversion logic.
- Be careful around cron, event, and logger code. Those are runtime integration points, not just utility functions.
- If you need package types in app code, prefer importing the public type exports from the root barrel.
- For orchestration-heavy work, read the relevant action module before changing helpers. Helper files alone usually do not explain the full workflow.

## Related Docs

- [`src/actions/README.md`](./src/actions/README.md)
- [`src/actions/helpers/README.md`](./src/actions/helpers/README.md)
- [`src/events/README.md`](./src/events/README.md)
- [`src/server/cron/README.md`](./src/server/cron/README.md)

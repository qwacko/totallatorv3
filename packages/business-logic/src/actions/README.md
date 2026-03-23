# Actions

This folder contains the domain-facing business APIs that are aggregated into [`tActions`](../actions/tActions.ts).

## What Belongs Here

An `*Actions.ts` module usually owns one business domain or workflow:

- CRUD-style domains such as accounts, bills, budgets, categories, labels, tags, notes, and reusable filters
- Workflow/orchestration domains such as journals, imports, reports, LLM operations, backups, and cron execution
- Runtime-facing domains that still represent business operations, such as auth and query-log access

## What Usually Does Not Belong Here

- Small reusable query builders
- text/filter conversion helpers
- report/import helper internals
- formatting utilities

Those belong under [`helpers`](./helpers/README.md) unless they are part of the public action contract for a domain.

## Reading Order

For a new agent exploring the package, this is the most useful reading order:

1. [`tActions.ts`](./tActions.ts) to see the grouped public surface.
2. The action module for the domain you care about.
3. Any helpers used by that action module under `helpers/<domain>/`.

## Conventions

Many action modules follow a common pattern:

- `latestUpdate`
- `getById`
- `count`
- `list`
- `listForDropdown`
- `createOrGet`
- `create`
- `update`
- `delete`
- `seed`

Not every action module follows that exact shape. `journal`, `import`, `report`, `backup`, `llm`, and cron-related actions are more workflow-oriented.

## Group Overview

- Core records: `account`, `bill`, `budget`, `category`, `label`, `tag`, `note`, `file`, `associatedInfo`
- Transactional/journal workflows: `journal`, `transactionChange`, `journalView`, `reusableFilter`
- Import pipeline: `import`, `importMapping`, `autoImport`
- Operational workflows: `backup`, `report`, `queryLog`
- AI and auth: `agentRun`, `llm`, `journalLlmSuggestion`, `auth`
- Scheduled work: `cronJob`, `cronExecution`
- User/admin: `user`

## Public Access

External code should normally use:

```ts
import { tActions } from '@totallator/business-logic';
```

Deep imports into individual action files are discouraged outside this package.

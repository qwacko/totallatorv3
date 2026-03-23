# Helpers

This folder contains internal support code used by action modules and collected public helpers surfaced through [`tHelpers`](../../tHelpers.ts).

## What Lives Here

Typical helper responsibilities:

- convert structured filters into SQL-friendly query fragments
- convert structured filters or updates into text
- build token arrays for search/filter matching
- implement report math/data shaping
- implement import pipeline steps
- provide seed helpers and small shared utilities

## Public vs Internal

Most files in this folder are internal implementation details.

The main public helper surface is:

```ts
import { tHelpers } from '@totallator/business-logic';
```

Use direct helper-file imports only when working inside `@totallator/business-logic`.

## Folder Guide

- `account`, `bill`, `budget`, `category`, `label`, `tag`
  Filter builders, text filters, insertion helpers, and table selection helpers for core domains.
- `journal`
  Journal-specific parsing, list generation, filter translation, update text conversion, and transfer/link handling.
- `import`
  Import detail lookup, list/query helpers, import processing pipeline steps, and import transaction helpers.
- `report`
  Report filter composition and data shaping for graph, sparkline, string, and numeric outputs.
- `file`, `note`, `associatedInfo`
  Query/filter helpers and grouping logic for file/note/associated-info relationships.
- `misc`
  Shared low-level utilities used across multiple domains.
- `seed`
  Seed helpers for tests or data bootstrapping.

## Conventions

Common file naming patterns:

- `*FilterToQuery.ts`
  Convert filter structures into DB query conditions.
- `*TextFilter.ts`
  Build searchable/filterable text arrays.
- `*CreateInsertionData.ts`
  Normalize domain input into insert payloads.
- `getCorrect*Table.ts`
  Choose the right database table/subquery for a domain.

## Guidance For Agents

- Start with `tHelpers` before reading helper internals.
- Drop into helper files only when you need implementation detail.
- Reuse existing helper patterns instead of introducing parallel filter/query conversion logic.

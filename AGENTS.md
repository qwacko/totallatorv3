# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` monorepo.
- `apps/webapp`: SvelteKit application (`src/routes`, `src/lib`, `static`).
- `apps/docs`: VitePress documentation site.
- `packages/*`: shared TypeScript libraries (`business-logic`, `database`, `shared`, `context`, `bullmq`, `logDatabase`).
- Root config: `pnpm-workspace.yaml`, `tsconfig.base.json`, `.prettierrc`, `.eslintrc.cjs`, CI in `.github/workflows`.

Keep feature logic close to its package/app. For web routes, follow SvelteKit file conventions such as `+page.svelte`, `+page.server.ts`, and `+server.ts`.

## Build, Test, and Development Commands
Run from repository root:
- `pnpm dev`: start all non-docs packages/apps in parallel.
- `pnpm webapp:dev`: run only the SvelteKit app.
- `pnpm build`: build workspace packages and webapp.
- `pnpm check`: run TypeScript/Svelte checks across workspace (except docs).
- `pnpm lint`: run Prettier check + ESLint recursively.
- `pnpm test`: run webapp integration + unit suite.
- `pnpm test:unit`: run Vitest unit tests.
- `pnpm docs:dev`: run docs locally.

## Coding Style & Naming Conventions
- Language: TypeScript (strict mode enabled).
- Formatting: Prettier (`useTabs: true`, `singleQuote: true`, `printWidth: 100`, no trailing commas).
- Linting: ESLint + `@typescript-eslint` + `eslint-plugin-svelte` + `eslint-plugin-drizzle`.
- Imports are auto-sorted by Prettier plugin; run `pnpm format` before pushing.
- Test files should use `*.test.ts` or `*.spec.ts`.

## Testing Guidelines
- Unit tests use Vitest (configured for `src/**/*.{test,spec}.{js,ts}`).
- Integration tests use Playwright (`pnpm test:integration` in `apps/webapp`).
- Add/adjust tests for behavior changes in touched packages/apps.
- CI currently enforces `pnpm build`, `pnpm check`, and `pnpm test:unit`.

## Commit & Pull Request Guidelines
Recent commit history favors short, imperative summaries (for example: `Fix type issues`, `Add observability infrastructure`).
- Keep subject lines concise and descriptive.
- Group related changes per commit; avoid mixed refactor/feature commits.
- PRs should include: clear summary, impacted areas (apps/packages), test evidence (`pnpm check`, `pnpm test:unit`), and screenshots for UI changes.
- Link related issues/tasks and call out migrations or env changes explicitly.

## Security & Configuration Tips
- Copy `.env.example` to `.env` for local setup.
- Never commit secrets or tokens.
- For schema changes, update the relevant package under `packages/database` (or `packages/logDatabase`) and include migration files.

## Database Migration Workflow
- Generate migrations with tooling only: `pnpm --filter @totallator/database db:generate` (or `db:custom` for custom cases).
- Do not hand-edit `packages/database/src/migrations/meta/_journal.json` or snapshot files in `packages/database/src/migrations/meta/`.
- If a migration needs manual SQL adjustment, regenerate via CLI so SQL + metadata stay in sync.

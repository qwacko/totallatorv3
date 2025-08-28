# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development

- `pnpm dev` - Start development server
- `pnpm build` - Build production version
- `pnpm preview` - Preview production build
- `pnpm check` - Run Svelte type checking
- `pnpm check:watch` - Run type checking in watch mode

### Testing

- `pnpm test` - Run all tests (integration + unit)
- `pnpm test:integration` - Run Playwright integration tests
- `pnpm test:unit` - Run Vitest unit tests with `TEST_ENV=true`

### Code Quality

- `pnpm lint` - Run Prettier and ESLint checks
- `pnpm format` - Format code with Prettier

### Database Management

Database commands are located in the `packages/database` package:

- `cd packages/database && pnpm db:generate` - Generate Drizzle migrations
- `cd packages/database && pnpm db:custom` - Generate custom Drizzle migrations  
- `cd packages/database && pnpm db:studio` - Open Drizzle Studio
- `cd packages/database && pnpm db:undo` - Drop database changes

### Documentation

- `pnpm docs:dev` - Start VitePress docs development server
- `pnpm docs:build` - Build documentation
- `pnpm docs:preview` - Preview built documentation

## Architecture Overview

### Tech Stack

- **Frontend**: SvelteKit 2, TypeScript, TailwindCSS 4, Flowbite UI components
- **Backend**: SvelteKit server-side with PostgreSQL database
- **Database**: Drizzle ORM with PostgreSQL, extensive use of materialized views
- **Authentication**: Custom session-based auth with Argon2 password hashing
- **Testing**: Playwright (integration), Vitest (unit)
- **Charts**: ECharts via svelte-echarts
- **File Handling**: Local filesystem and S3 storage support

### Core Database Architecture

- **Primary Schema**: Located in `src/lib/server/db/postgres/schema/`
- **Materialized Views**: Heavily used for performance optimization, managed via rate-limited refresh system
- **Migrations**: Auto-migration on startup (except in test/build environments)
- **Connection**: PostgreSQL with connection pooling

### Application Structure

- **Route Structure**: Traditional SvelteKit file-based routing with `(loggedIn)` and `(loggedOut)` groups
- **Authentication Flow**: Session-based with first-user setup flow
- **State Management**: Svelte stores for dropdowns, notifications, and user info
- **Form Handling**: sveltekit-superforms with Zod validation
- **Server Actions**: Centralized in `src/lib/server/db/actions/`

### Key Features

- **Financial Tracking**: Accounts, transactions (journals), categories, budgets, bills
- **Import System**: CSV/JSON import with mapping configuration and auto-import capabilities
- **LLM Integration**: AI-powered journal categorization and recommendations with provider management
- **Reporting**: Configurable reports with various chart types and layouts
- **File Management**: Attachment system with thumbnails and linking
- **Backup/Restore**: Compressed backup system with scheduled backups
- **Multi-user**: User management with admin controls

### Environment Configuration

- Extensive environment variable system via `src/lib/server/serverEnv.ts`
- Supports PostgreSQL connection, S3 storage, logging levels, cron schedules
- Development vs production configuration handling

### Testing Approach

- Unit tests for helpers and utilities (look for `.test.ts` files)
- Integration tests via Playwright
- Database seeding for tests in `src/lib/server/db/test/`
- Tests run with `TEST_ENV=true` to skip migrations

### Performance Considerations

- Materialized views for complex queries with automatic refresh management
- Rate-limited materialized view refreshing to prevent cascading updates
- Connection pooling and query logging for debugging
- Concurrent processing options for heavy operations

## Development Notes

### Database Schema Changes

When modifying database schema:

1. Update schema files in `src/lib/server/db/postgres/schema/`
2. Run `pnpm db:generate` to create migration
3. Test migration with clean database

### Materialized View System

The app uses materialized views extensively for performance. Views are automatically refreshed when underlying data changes, but this is rate-limited to prevent performance issues.

### Authentication System

Custom session-based authentication using Oslo crypto libraries. First user becomes admin automatically.

### Import System

Supports CSV and JSON imports with configurable field mapping. Auto-import capability for scheduled data fetching from external services.

# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

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

- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:custom` - Generate custom Drizzle migrations
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:undo` - Drop database changes

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

## Key Features

- **Financial Tracking**: Accounts, transactions (journals), categories, budgets, bills
- **Import System**: CSV/JSON import with mapping configuration and auto-import capabilities
- **LLM Integration**: AI-powered journal categorization and recommendations with provider management
- **Reporting**: Configurable reports with various chart types and layouts
- **File Management**: Attachment system with thumbnails and linking
- **Backup/Restore**: Compressed backup system with scheduled backups
- **Multi-user**: User management with admin controls

## Agent Personas

I can assist you across various aspects of this project by leveraging specialized knowledge in the following areas:

- **Database Actions Manager**: I am an expert in `src/lib/server/db/actions/`. I can develop, modify, and manage database actions, including CRUD operations and business logic, while adhering to established patterns and ensuring data integrity.
- **Documentation Manager**: I am an expert in VitePress documentation. I can create, update, and manage user guides, developer documentation, and configuration guides, ensuring consistency and accuracy.
- **Drizzle Database Manager**: I am an expert in Drizzle ORM and PostgreSQL. I can modify database schema, create/review migrations, and optimize database structures, ensuring schema changes align with materialized views.
- **Import/Export Specialist**: I am an expert in data import/export systems. I can work with CSV/JSON imports, mapping configurations, auto-import capabilities, and data transformation logic, ensuring data accuracy and security.
- **LLM Service Integrator**: I am an expert in LLM services. I can manage AI-powered features like journal categorization and recommendations, optimize context builders, and integrate new LLM providers.
- **Reporting Dashboard Builder**: I am an expert in reporting and dashboards. I can design and implement reports and dashboards using ECharts, manage layouts, and handle data visualization for financial data.
- **Svelte Component Architect**: I am an expert in Svelte 5 components. I can create, modify, and organize reusable, accessible, and performant Svelte components using runes, Flowbite UI, and TailwindCSS.
- **SvelteKit Route Manager**: I am an expert in SvelteKit routing. I can create, modify, and manage SvelteKit routes, server actions, page logic, and authentication configurations, ensuring consistency with `routes.ts` and `authGuardConfig.ts`.
- **Testing Automation Expert**: I am an expert in testing automation. I can create and manage Playwright integration tests and Vitest unit tests, including test seeding and data management, to ensure application reliability.
- **TypeScript Expert**: I am an expert in TypeScript. I can work with TypeScript type checking, type generation, and improve type safety, resolving errors and implementing robust type patterns without compromising runtime behavior.

## Interaction Guidelines

- **Be Specific**: The more specific you are with your requests, the better I can assist you.
- **Provide Context**: When asking for changes, provide as much context as possible, including file paths and relevant code snippets.
- **Use Personas**: To ensure the best results, delegate tasks to the appropriate expert persona.
- **Review Changes**: Carefully review any code changes I make to ensure they meet your requirements.
- **Provide Feedback**: Your feedback is valuable. If you're not satisfied with the results, please let me know how I can improve.

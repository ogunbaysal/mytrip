# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo travel booking application with three main applications:
- `apps/web` - Customer-facing booking app (Next.js 15, port 3000)
- `apps/admin` - Admin dashboard (Next.js, port 3001)
- `apps/api` - Backend API server (Hono + Bun, port 3002)

## Development Commands

### Environment Setup
- Install dependencies: `bun install` (run from root)
- Each app requires its own `.env` file (see AGENTS.md for required variables)

### Development
- Start all apps: `bun run dev` (uses Turborepo)
- Start specific app: `bun run dev --filter=web|admin|api`
- Or navigate to app directory: `cd apps/api && bun run dev`

### Production & Quality
- Build all: `bun run build`
- Build specific: `bun run build --filter=web`
- Lint: `bun run lint`
- Type check: `bun run type-check`
- Clean: `bun run clean`

### Testing
- API tests: `cd apps/api && bun test` (uses `bun:test`)

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 + App Router, React 19, TypeScript, Turbopack
- **UI**: shadcn/ui (Radix primitives + Tailwind v4)
- **State Management**: TanStack Query (provided via `AppProvider`/`QueryProvider`)
- **Backend**: Hono framework on Bun runtime
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth (drizzle adapter, mounted at `/api/auth/*`)

### Path Aliases
- `@/*` maps to `apps/web/` (used by both web and admin apps)

### Data Fetching Patterns
- Use TanStack Query for all client data fetching, polling, and auth flows
- Query client is provided via `AppProvider`/`QueryProvider` in layout.tsx
- Avoid manual fetch state management

### Database
- Schemas in `apps/api/src/db/schemas/`
- Migrations in `apps/api/src/db/migrations/`
- Use Drizzle migrations for schema changes

## Code Style

- TypeScript-first with explicit return types on shared utilities
- Prettier 3 formatting (2-space indent, semicolons off)
- Components: PascalCase, functions/hooks: camelCase, routes: kebab-case
- Use `@/*` alias for shared UI/modules
- Colocate styles with Tailwind utility classes

## Testing Guidelines

- Add `*.test.ts` files near code being tested
- Use `bun:test` style (`describe`/`test`/`expect`)
- Cover auth paths, origin handling, and API contracts
- Include smoke tests for UI components when possible
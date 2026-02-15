# Repository Guidelines

## Architecture Overview

### Monorepo Structure

```text
apps/
├── web/   # Public + owner-facing app (Next.js 15, port 3000)
├── admin/ # Admin panel (Next.js 16, port 3001)
└── api/   # Hono + Bun API server (port 3002)
```

### Web App (`apps/web`)
- Next.js 15 App Router + Turbopack
- React 19 + TypeScript
- shadcn/ui + Tailwind v4
- Path alias: `@/*` -> `apps/web/src/*`
- TanStack Query is provided via `AppProviders` (`apps/web/src/providers/app-providers.tsx`)
- Includes both traveler experience and owner dashboard (`/dashboard/*`)

### Admin App (`apps/admin`)
- Next.js 16 App Router + Turbopack
- React 19 + TypeScript
- shadcn/ui + Tailwind v4
- Path alias: `@/*` -> `apps/admin/*`
- TanStack Query is provided via `Providers` (`apps/admin/components/providers.tsx`)
- Auth-protected dashboard routes under `app/(dashboard)`

### API Server (`apps/api`)
- Hono framework running on Bun
- Drizzle ORM + PostgreSQL
- Better Auth with separate auth namespaces:
  - Admin auth: `/api/auth/*`
  - Web user auth: `/api/web/auth/*`
- Public API domains: places, collections, blog, reviews, search
- Operational domains: profile, business registration, subscriptions, locations, owner routes, admin routes
- Routes in `apps/api/src/routes/`, schemas in `apps/api/src/db/schemas/`

## Key Product Features (Current)
- Public discovery: places, collections, blog, map/list filtering, reviews, search.
- Owner workflows: business registration, owner dashboard, place/blog CRUD, upload, subscription and usage management.
- Admin operations: users/admins, places/reviews/blog moderation, approvals, plans/coupons/subscriptions/payments, analytics, settings.
- Uploads are backed by S3-compatible object storage (MinIO-compatible config via env).

## Environment Variables

### API (`apps/api/.env`)
Required in most environments:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `ALLOWED_ORIGINS`
- `MINIO_ENDPOINT`
- `MINIO_BUCKET`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`

Common optional envs:
- `DATABASE_SSL`
- `PORT` (default `3002`)
- `PGPOOL_MAX`, `PGPOOL_IDLE_MS`, `PGPOOL_CONN_TIMEOUT_MS`
- `COOKIE_DOMAIN`
- `BETTER_AUTH_ADMIN_COOKIE_PREFIX`, `BETTER_AUTH_WEB_COOKIE_PREFIX`
- `MINIO_PUBLIC_BASE_URL`, `MINIO_REGION`, `MINIO_FORCE_PATH_STYLE`
- `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL` (payment provider integration)

### Web (`apps/web/.env.local`)
- `NEXT_PUBLIC_API_BASE_URL` (recommended)
- `NEXT_PUBLIC_API_URL` (fallback in some clients)

### Admin (`apps/admin/.env`)
- `NEXT_PUBLIC_API_BASE_URL` (recommended)
- `NEXT_PUBLIC_API_URL` (used by auth client / fallback paths)

## Project Structure & Module Organization
- Monorepo managed by Turborepo (`apps/*` workspaces).
- Public API: `apps/api/src/routes/*.ts`
- Admin API: `apps/api/src/routes/admin/*.ts`
- Owner API: `apps/api/src/routes/owner/*.ts`
- DB schemas: `apps/api/src/db/schemas/*.ts`
- Reference docs in `docs/`:
  - `better-auth/`
  - `drizzle-orm/`
  - `tanstack-query/`
  - `turborepo/`
  - `PRD.md`

## Build, Test, and Development Commands
- Install dependencies: `bun install`
- Run all apps: `bun run dev`
- Run single app:
  - `bun run dev --filter=web`
  - `bun run dev --filter=admin`
  - `bun run dev --filter=api`
- Build all: `bun run build`
- Lint all: `bun run lint`
- Type-check all (turbo task): `bunx turbo run type-check`
- Clean turbo artifacts: `bunx turbo run clean`

API-specific:
- `cd apps/api && bun run dev`
- `cd apps/api && bun run type-check`
- `cd apps/api && bun run db:generate`
- `cd apps/api && bun run db:migrate`
- `cd apps/api && bun run db:seed`

## Coding Style & Naming Conventions
- TypeScript-first across all packages.
- Follow existing ESLint/Next conventions and project formatting style.
- Naming:
  - Components: `PascalCase`
  - Functions/hooks: `camelCase`
  - Route segments: kebab-case
- Prefer TanStack Query for client data fetching/mutations and auth-dependent flows.
- Keep imports on `@/*` aliases scoped to each app.

## Testing Guidelines
- Add tests next to the feature (`*.test.ts`) when introducing or changing behavior.
- Prioritize coverage for:
  - auth/session flows,
  - business approvals,
  - subscription state transitions,
  - owner place/blog mutation endpoints,
  - admin moderation actions.
- If no automated tests are added, document manual verification steps in PR notes.

## Documents
Carefully analyze `docs/PRD.md` before implementing new features.

For library or framework behavior:
1. Check `docs/` first.
2. If needed information is missing, use Context7 MCP for up-to-date docs.

## Commit & Pull Request Guidelines
- Use concise imperative commits with explicit scope (e.g., `fix: normalize owner place filters`).
- PRs should include:
  - scope and rationale,
  - test/verification steps,
  - env var changes,
  - screenshots for UI changes.
- Keep branches rebased on main and avoid noisy diffs.

## Notes
- Before editing, validate assumptions against current code paths and schema.
- Prefer small, safe changes with clear type guarantees.
- Apply SOLID and clean architecture principles where practical.
- For Better Auth / Drizzle / TanStack Query changes, verify patterns against docs (local docs first, Context7 fallback).
- Always use context7 for library related updates. For example, if you want to implementat something related to better-auth library, use context7 mcp to get the latest docs and implementation patterns.

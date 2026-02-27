# Technology Stack

**Analysis Date:** 2026-02-27

## Languages

**Primary:**
- TypeScript 5.9.x across all apps (`apps/web`, `apps/admin`, `apps/api`)

**Secondary:**
- SQL (Drizzle migrations in `apps/api/src/db/migrations/*.sql`)
- JavaScript/TS config files (`turbo.json`, `playwright.config.ts`, `apps/*/next.config.ts`)

## Runtime

**Environment:**
- Bun 1.2.22 as workspace package manager and API runtime (`package.json`, `apps/api/package.json`)
- Node.js 20+ required by Next 16 app and CI browser tests (`apps/admin/package.json`, `.github/workflows/playwright.yml`)

**Package Manager:**
- Primary: Bun (`bun install`, `bun run dev`, turbo tasks)
- Secondary: npm in Playwright CI (`npm ci`, `npx playwright test`)
- Lockfiles present: `bun.lock`, `package-lock.json`

## Frameworks

**Core:**
- Next.js 15.5.7 + React 19.2.0 in web app (`apps/web/package.json`)
- Next.js 16.0.7 + React 19.2.0 in admin app (`apps/admin/package.json`)
- Hono 4.9.x on Bun for API routing (`apps/api/src/index.ts`)
- Drizzle ORM 0.44.x + `pg` for PostgreSQL access (`apps/api/src/db/index.ts`)

**Testing:**
- `bun:test` unit tests in API helper layer (`apps/api/src/lib/*.test.ts`)
- Playwright multi-browser suite at repo root (`playwright.config.ts`, `tests/*.spec.ts`)

**Build/Dev:**
- Turborepo 2.8.x task orchestration (`turbo.json`)
- TypeScript `tsc --noEmit` for type-check/lint-like verification

## Key Dependencies

**Critical:**
- `better-auth` for admin + web auth namespaces (`apps/api/src/lib/auth.ts`, `apps/api/src/lib/web-auth.ts`)
- `drizzle-orm` for schema-first DB access (`apps/api/src/db/schemas/*.ts`)
- `@tanstack/react-query` for frontend data cache/providers (`apps/web/src/providers/app-providers.tsx`, `apps/admin/components/providers.tsx`)
- `zod` and `@hono/zod-validator` for API boundary validation (`apps/api/src/routes/*.ts`)
- `@aws-sdk/client-s3` for object uploads (`apps/api/src/lib/object-storage.ts`)

**Infrastructure:**
- `pg` connection pool for PostgreSQL (`apps/api/src/db/index.ts`)
- `nanoid` and `uuid` for identifiers (`apps/api/src/routes/subscriptions.ts`, `apps/api/src/lib/object-storage.ts`)

## Configuration

**Environment:**
- API env contract in `apps/api/.env` (`DATABASE_URL`, `BETTER_AUTH_*`, `MINIO_*`, `IYZICO_*`)
- Web/admin API base URL envs in `apps/web/.env.local` and `apps/admin/.env`
- Turbo env passthrough in `turbo.json` `globalEnv`

**Build:**
- `turbo.json` pipeline for `dev`, `build`, `lint`, `type-check`, DB tasks
- TypeScript configs: `tsconfig.base.json`, `apps/*/tsconfig.json`
- Next configs: `apps/web/next.config.ts`, `apps/admin/next.config.ts`
- Drizzle config: `apps/api/drizzle.config.ts`

## Platform Requirements

**Development:**
- Bun + Node installed locally
- PostgreSQL reachable through `DATABASE_URL`
- S3-compatible object storage configured through `MINIO_*`

**Production:**
- Web/admin deploy as Next standalone builds (`output: "standalone"`)
- API deploy as Bun target bundle (`bun build src/index.ts --target bun`)
- External PostgreSQL + object storage are mandatory

---

*Stack analysis: 2026-02-27*
*Update after major dependency changes*

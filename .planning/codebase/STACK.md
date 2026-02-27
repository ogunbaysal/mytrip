# Technology Stack

**Analysis Date:** 2026-02-27

## Languages

**Primary:**
- TypeScript 5.9.x - All three applications (`apps/web`, `apps/admin`, `apps/api`)

**Secondary:**
- JavaScript - Tooling/config files (`playwright.config.ts` executes in Node context, ESLint/Next config files)
- SQL - Drizzle migrations in `apps/api/src/db/migrations/*.sql`

## Runtime

**Environment:**
- Bun 1.2.22 - Primary package manager/runtime (`package.json`, `apps/api/package.json`)
- Node.js 18+ - Required for Playwright and GitHub Actions (`README.md`, `.github/workflows/playwright.yml`)

**Package Manager:**
- Bun (workspace install and dev/build scripts)
- npm lockfile also present (`package-lock.json`) and used in Playwright CI workflow
- Lockfiles: `bun.lock`, `package-lock.json`

## Frameworks

**Core:**
- Next.js 15.5.7 + React 19.2.0 - Public/owner app in `apps/web`
- Next.js 16.0.x + React 19.2.0 - Admin app in `apps/admin`
- Hono 4.9.x on Bun - API server in `apps/api/src/index.ts`
- Drizzle ORM 0.44.x + PostgreSQL (`apps/api/src/db/index.ts`)

**Testing:**
- `bun:test` - API library unit tests (`apps/api/src/lib/*.test.ts`)
- Playwright - E2E smoke tests (`tests/example.spec.ts`)

**Build/Dev:**
- Turborepo 2.8.x orchestration (`turbo.json`)
- TypeScript `tsc --noEmit` used as lint/type-check signal in API and app packages

## Key Dependencies

**Critical:**
- `better-auth` - Admin and web-user auth namespaces (`apps/api/src/lib/auth.ts`, `apps/api/src/lib/web-auth.ts`)
- `drizzle-orm` - Typed database access and relational querying (`apps/api/src/db/index.ts`)
- `@tanstack/react-query` - Client-side data-fetching cache providers (`apps/web/src/providers/app-providers.tsx`, `apps/admin/components/providers.tsx`)
- `zod` + `@hono/zod-validator` - Route input validation (`apps/api/src/routes/**/*.ts`)
- `@aws-sdk/client-s3` - Object storage integration (`apps/api/src/lib/object-storage.ts`)

**Infrastructure:**
- `pg` - PostgreSQL connection pool (`apps/api/src/db/index.ts`)
- `nanoid`/`uuid` - ID generation across domain and uploads

## Configuration

**Environment:**
- API config in `apps/api/.env` (DB, auth, CORS, object storage, payment provider)
- Web/admin base URL envs in `apps/web/.env.local` and `apps/admin/.env`
- Shared env propagation in `turbo.json` `globalEnv`

**Build:**
- Turborepo pipeline in `turbo.json`
- TS configs: `tsconfig.base.json`, `apps/*/tsconfig.json`
- Next configs: `apps/web/next.config.ts`, `apps/admin/next.config.ts`
- Drizzle config: `apps/api/drizzle.config.ts`

## Platform Requirements

**Development:**
- macOS/Linux/Windows with Bun and Node
- PostgreSQL available via `DATABASE_URL`
- S3-compatible storage endpoint for upload flows (`MINIO_*` vars)

**Production:**
- Next.js standalone outputs for web/admin (`output: "standalone"`)
- Bun runtime target for API build (`bun build --target bun`)
- External DB and object storage required

---

*Stack analysis: 2026-02-27*
*Update after major dependency changes*

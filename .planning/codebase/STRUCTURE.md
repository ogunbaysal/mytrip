# Codebase Structure

**Analysis Date:** 2026-02-27

## Directory Layout

```
mytrip/
├── apps/                         # Monorepo applications
│   ├── web/                      # Public + owner Next.js app
│   ├── admin/                    # Admin Next.js app
│   └── api/                      # Bun/Hono API + DB layer
├── docs/                         # Product and framework reference docs
├── tests/                        # Root Playwright tests
├── turbo.json                    # Turborepo pipeline definition
├── package.json                  # Workspace scripts/dependencies
├── bun.lock                      # Bun lockfile
└── package-lock.json             # npm lockfile (CI path currently uses npm)
```

## Directory Purposes

**apps/web/**
- Purpose: Traveler-facing discovery + owner dashboard UX
- Contains: App Router pages, UI components, hooks, query/api utilities
- Key files: `apps/web/src/app/layout.tsx`, `apps/web/src/lib/api.ts`, `apps/web/src/providers/app-providers.tsx`
- Subdirectories: `src/app`, `src/components`, `src/hooks`, `src/lib`, `src/stores`

**apps/admin/**
- Purpose: Admin moderation and operations dashboard
- Contains: App Router `(dashboard)` routes, admin hooks/components, auth-aware API helpers
- Key files: `apps/admin/app/(dashboard)/layout.tsx`, `apps/admin/lib/api.ts`, `apps/admin/components/providers.tsx`
- Subdirectories: `app`, `components`, `hooks`, `lib`, `types`

**apps/api/**
- Purpose: HTTP API, auth handlers, database schemas/migrations, business logic
- Contains: Hono routes, middleware, libs, Drizzle schema and migration artifacts
- Key files: `apps/api/src/index.ts`, `apps/api/src/routes/`, `apps/api/src/db/schemas/index.ts`
- Subdirectories: `src/routes`, `src/lib`, `src/middleware`, `src/db`, `public/uploads`

**docs/**
- Purpose: Internal references (PRD + Better Auth/Drizzle/TanStack/Turborepo notes)
- Key file: `docs/PRD.md`

## Key File Locations

**Entry Points:**
- `apps/api/src/index.ts`: API bootstrap and route composition
- `apps/web/src/app/layout.tsx`: Web root layout/provider shell
- `apps/admin/app/layout.tsx`: Admin root layout/provider shell

**Configuration:**
- `turbo.json`: Task graph and env passthrough
- `tsconfig.base.json`, `apps/*/tsconfig.json`: TypeScript config chain
- `apps/web/next.config.ts`, `apps/admin/next.config.ts`: Next runtime/build config
- `apps/api/drizzle.config.ts`: Migration generation config

**Core Logic:**
- `apps/api/src/routes/owner/places.ts`: largest owner domain mutation/query surface
- `apps/api/src/routes/subscriptions.ts`: plan purchase, coupon, webhook handling
- `apps/api/src/lib/plan-entitlements.ts`: quota/entitlement computations

**Testing:**
- `apps/api/src/lib/*.test.ts`: Bun unit tests for core helpers
- `tests/example.spec.ts`: root Playwright smoke tests
- `playwright.config.ts`: Playwright suite config

**Documentation:**
- `README.md`: setup and architecture summary
- `AGENTS.md`: repository-specific agent execution guidance

## Naming Conventions

**Files:**
- Kebab-case for most modules (`place-kind-registry.ts`, `app-providers.tsx`)
- Test suffix for unit tests (`*.test.ts`) and Playwright specs (`*.spec.ts`)
- `index.ts` used for route/schema aggregation

**Directories:**
- Plural domain directories (`routes`, `schemas`, `components`, `hooks`)
- Next route segment folders follow App Router conventions (`(dashboard)`, `[slug]`)

## Where to Add New Code

**New API Route Domain:**
- Router: `apps/api/src/routes/<domain>.ts` (or `routes/admin|owner/` for protected domains)
- Shared business logic: `apps/api/src/lib/`
- Schema changes: `apps/api/src/db/schemas/` + migration in `apps/api/src/db/migrations/`
- Tests: colocate in `apps/api/src/lib/` or add endpoint-level tests

**New Web/Admin Feature:**
- Route/page: `apps/web/src/app/...` or `apps/admin/app/...`
- API client/hook: `apps/*/lib/api.ts` and `apps/*/hooks/*`
- UI components: `apps/*/components/`

**Shared Docs/Planning:**
- Product and tech references: `docs/`
- Codebase map and planning artifacts: `.planning/codebase/`

## Special Directories

**apps/api/public/uploads/**
- Purpose: local/public upload artifacts
- Source: persisted from upload flows and seed/dev usage
- Committed: currently tracked in repository (binary growth risk)

**apps/*/.next, apps/*/.turbo, apps/api/dist/**
- Purpose: generated build/dev output
- Source: Next/Bun/Turbo builds
- Committed: ignored by `.gitignore`

---

*Structure analysis: 2026-02-27*
*Update when directory structure changes*

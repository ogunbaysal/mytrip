# Architecture

**Analysis Date:** 2026-02-27

## Pattern Overview

**Overall:** Monorepo with two Next.js frontend applications and one Bun/Hono backend API.

**Key Characteristics:**
- Turborepo task orchestration across independent deployable apps
- Layered API handlers (route -> validation -> domain helpers -> Drizzle DB)
- Dual auth namespaces for admin users and traveler/web users
- Domain-driven route segmentation (public, owner, admin, subscription, profile)

## Layers

**Presentation Layer (Web/Admin):**
- Purpose: Render public discovery, owner dashboard, and admin control surfaces
- Contains: App Router routes and UI components (`apps/web/src/app`, `apps/admin/app`)
- Depends on: Query clients and HTTP helpers (`apps/*/lib/api.ts`)
- Used by: Browser clients

**API Interface Layer:**
- Purpose: Define HTTP endpoints and request/response boundaries
- Contains: Hono routers (`apps/api/src/routes/**/*.ts`)
- Depends on: Validation + domain libs + DB
- Used by: web/admin clients and external callers

**Domain/Application Layer:**
- Purpose: Business rules (entitlements, place capability matrix, upload lifecycle, payment orchestration)
- Contains: `apps/api/src/lib/*.ts` helpers such as `plan-entitlements.ts`, `place-kind-registry.ts`, `payment-provider.ts`
- Depends on: DB schema/models and external integrations
- Used by: API routes

**Data Layer:**
- Purpose: Persistence and schema definitions
- Contains: Drizzle schema + migrations (`apps/api/src/db/schemas`, `apps/api/src/db/migrations`)
- Depends on: PostgreSQL via `pg`
- Used by: domain libs and route handlers

## Data Flow

**HTTP Request (Owner/Admin/Public):**
1. Request reaches Bun/Hono entrypoint (`apps/api/src/index.ts`)
2. Router delegates to route group (`/api`, `/api/admin`, `/api/owner`, etc.)
3. Auth middleware/session resolver runs where required (`admin-auth.ts`, `session.ts`)
4. Zod validation applies at boundary (`zValidator` in route files)
5. Domain helpers evaluate business rules and compose DB queries
6. Drizzle executes SQL against PostgreSQL and response is serialized as JSON

**Frontend Data Fetch:**
1. React components/hooks call API wrappers (`apps/web/src/lib/api.ts`, `apps/admin/lib/api.ts`)
2. TanStack Query caches and reuses responses via provider-level QueryClient
3. Cookie credentials are included for protected endpoints

**State Management:**
- Persistent state: PostgreSQL tables
- Client cache state: TanStack Query in-memory cache per app session
- Process-local state: in-memory rate limiter map (API instance local)

## Key Abstractions

**Route Group Modules:**
- Purpose: Aggregate endpoint domains
- Examples: `apps/api/src/routes/index.ts`, `apps/api/src/routes/admin/index.ts`, `apps/api/src/routes/owner/index.ts`
- Pattern: Hono sub-app composition with `app.route(...)`

**Entitlement Evaluation:**
- Purpose: Gate owner actions by plan limits and resource kind
- Examples: `apps/api/src/lib/plan-entitlements.ts`, `apps/api/src/lib/entitlement-evaluator.ts`
- Pattern: Pure helper + DB-backed hydration

**Kind Capability Registry:**
- Purpose: Determine which place kinds support rooms/menu/packages
- Examples: `apps/api/src/lib/place-kind-registry.ts`
- Pattern: centralized capability lookup used by owner routes

## Entry Points

**API Server:**
- Location: `apps/api/src/index.ts`
- Triggers: HTTP requests on configured port (default 3002)
- Responsibilities: CORS, auth mounts, route composition, health endpoints

**Web App:**
- Location: `apps/web/src/app/layout.tsx` + page routes in `apps/web/src/app/*`
- Triggers: Browser navigation on Next runtime
- Responsibilities: public + owner UI rendering and query provider wiring

**Admin App:**
- Location: `apps/admin/app/layout.tsx` + `(dashboard)` route segment
- Triggers: Browser navigation for admin domain
- Responsibilities: admin auth client usage, dashboard views, moderation flows

## Error Handling

**Strategy:**
- Boundary catches in middleware/route handlers returning JSON error payloads
- Utility helpers throw and are mapped by callers to HTTP responses

**Patterns:**
- `try/catch` around auth/session and external API operations
- Validation failures return 4xx via zod validator middleware behavior
- Console logging for operational visibility

## Cross-Cutting Concerns

**Logging:**
- Predominantly `console.log`/`console.error` in API server and scripts

**Validation:**
- Zod schemas defined close to route handlers

**Authentication:**
- Better Auth session resolution in middleware, with distinct admin and web contexts

**Authorization:**
- Role/status checks in admin middleware and entitlement checks in owner mutation routes

---

*Architecture analysis: 2026-02-27*
*Update when major patterns change*

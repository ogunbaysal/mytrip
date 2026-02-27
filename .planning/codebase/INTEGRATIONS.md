# External Integrations

**Analysis Date:** 2026-02-27

## APIs & External Services

**Payment Processing:**
- Iyzico subscription APIs for paid plan creation/cancellation and webhook reconciliation
  - SDK/Client: custom `fetch` + HMAC signing in `apps/api/src/lib/payment-provider.ts`
  - Auth: `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, optional `IYZICO_BASE_URL`
  - Endpoints used: `/v2/subscription/initialize`, `/v2/subscription/subscriptions/:id/cancel`

**External APIs:**
- No live third-party REST API dependency detected in runtime route handlers
- Static location seed source from `turkey-neighbourhoods` package in `apps/api/src/db/seeders/seed-core.ts`

## Data Storage

**Databases:**
- PostgreSQL - Primary operational store
  - Connection: `DATABASE_URL` via `pg` pool in `apps/api/src/db/index.ts`
  - ORM: Drizzle (`drizzle-orm/node-postgres`)
  - Migrations: `apps/api/src/db/migrations/` via Drizzle Kit commands

**File Storage:**
- S3-compatible object storage (MinIO-compatible)
  - SDK: `@aws-sdk/client-s3` in `apps/api/src/lib/object-storage.ts`
  - Auth: `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - Endpoint config: `MINIO_ENDPOINT`, `MINIO_BUCKET`, optional `MINIO_PUBLIC_BASE_URL`
  - Integration points: `apps/api/src/lib/object-storage.ts`, `apps/api/src/lib/upload-service.ts`

**Caching:**
- No dedicated Redis/Memcached integration detected
- In-memory rate-limit map in `apps/api/src/middleware/rate-limit.ts` (single-process only)

## Authentication & Identity

**Auth Provider:**
- Better Auth with Drizzle adapter
  - Admin namespace: `/api/auth/*` using `apps/api/src/lib/auth.ts`
  - Web user namespace: `/api/web/auth/*` using `apps/api/src/lib/web-auth.ts`
  - Cookie cross-subdomain behavior is env-controlled (`COOKIE_DOMAIN`, `BETTER_AUTH_ADMIN_COOKIE_PREFIX`, `BETTER_AUTH_WEB_COOKIE_PREFIX`)

**OAuth Integrations:**
- No active social provider configuration (`socialProviders: {}` in both auth configs)

## Monitoring & Observability

**Error Tracking:**
- No Sentry/Bugsnag/etc integration found
- Error handling primarily logs to stdout/stderr (`console.error` in route handlers and middleware)

**Analytics:**
- Internal analytics domain persisted in DB (`apps/api/src/db/schemas/analytics.ts`) rather than external analytics SaaS

**Logs:**
- Process logs via console statements
- No structured external log sink configured in codebase

## CI/CD & Deployment

**Hosting:**
- Next apps configured for standalone output (`apps/web/next.config.ts`, `apps/admin/next.config.ts`)
- API built into Bun target bundle (`apps/api/package.json` scripts)

**CI Pipeline:**
- GitHub Actions Playwright workflow in `.github/workflows/playwright.yml`
  - Uses `npm ci`, browser install, and `npx playwright test`
  - No API/web/admin integration test job currently defined in workflows

## Environment Configuration

**Development:**
- Required API vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ALLOWED_ORIGINS`, storage vars
- Optional tuning vars: `PGPOOL_*`, `DATABASE_SSL`, payment defaults for Iyzico customer payloads
- Local defaults assume `localhost:3000/3001/3002`

**Staging/Production:**
- API/public URLs configured via `NEXT_PUBLIC_API_BASE_URL` or `NEXT_PUBLIC_API_URL`
- Separate credentials required for DB, storage, and payment provider

## Webhooks & Callbacks

**Incoming:**
- Iyzico webhook processing in `apps/api/src/routes/subscriptions.ts`
  - Verification helper: `verifyIyzicoSubscriptionWebhookSignature` in `apps/api/src/lib/iyzico-webhook.ts`
  - Signature is HMAC-based using merchant + secret + event fields
  - Optional bypass exists via `IYZICO_WEBHOOK_ALLOW_UNSIGNED=true` (risk to control per environment)

**Outgoing:**
- Server-originated provider calls to Iyzico from `payment-provider.ts`
- Owner/admin clients call API endpoints over HTTP with cookie auth (`apps/web/src/lib/api.ts`, `apps/admin/lib/api.ts`)

---

*Integration audit: 2026-02-27*
*Update when adding/removing external services*

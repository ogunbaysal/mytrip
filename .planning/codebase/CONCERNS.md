# Codebase Concerns

**Analysis Date:** 2026-02-27

## Tech Debt

**Build-time safety reduced in Next apps:**
- Issue: Both Next apps disable strict build gating (`ignoreBuildErrors`, and web also `ignoreDuringBuilds`)
- Files: `apps/web/next.config.ts`, `apps/admin/next.config.ts`
- Impact: Type/lint regressions can ship to production builds
- Fix approach: Re-enable build checks and resolve outstanding lint/type failures incrementally

**Large multi-responsibility route modules:**
- Issue: Very large route files combine validation schemas, transform utilities, and handlers
- Files: `apps/api/src/routes/owner/places.ts`, `apps/api/src/routes/subscriptions.ts`, `apps/api/src/routes/admin/subscriptions.ts`
- Impact: Harder review, fragile edits, higher regression risk
- Fix approach: Extract domain service modules and move schema definitions to dedicated files per subdomain

## Known Bugs / Logic Gaps

**Admin-or-owner auth middleware is admin-only in practice:**
- Symptoms: owner users may fail auth for paths expecting dual access
- Files: `apps/api/src/middleware/admin-auth.ts`
- Trigger: `adminOrOwnerAuth` fallback path does not actually validate web-user session
- Workaround: Route owners through dedicated owner session middleware
- Root cause: TODO left unresolved in middleware

**Permission check TODO for admin management:**
- Symptoms: potential over-permission for admin creation/update flows
- File: `apps/api/src/routes/admin/auth.ts`
- Trigger: missing fine-grained `manage:admins` gate
- Workaround: rely on current role setup and restricted endpoint usage
- Root cause: incomplete authorization hardening

## Security Considerations

**Environment object logging in API startup:**
- Risk: `console.log({ minio: process.env })` can expose secrets in logs
- File: `apps/api/src/index.ts`
- Current mitigation: none in code
- Recommendations: remove full env logging, whitelist only non-sensitive startup diagnostics

**Session and cookie boundary complexity across admin/web namespaces:**
- Risk: misconfigured cookie domain/prefix could cause auth leakage or session confusion
- Files: `apps/api/src/lib/auth.ts`, `apps/api/src/lib/web-auth.ts`, `apps/api/src/lib/session.ts`
- Current mitigation: separate cookie prefixes and optional cross-subdomain config
- Recommendations: add integration tests for cross-origin cookie behavior in staging

## Performance Bottlenecks

**In-memory rate limiter does not scale horizontally:**
- Problem: rate limits are instance-local and reset on process restart
- File: `apps/api/src/middleware/rate-limit.ts`
- Cause: `Map` store + interval cleanup only in local process memory
- Improvement path: use Redis/shared store with atomic counters and TTL

**Potential heavy query paths in subscription and owner domains:**
- Problem: wide aggregation and join-heavy hydration logic can become expensive with growth
- Files: `apps/api/src/routes/admin/subscriptions.ts`, `apps/api/src/routes/owner/places.ts`
- Cause: complex per-request data hydration and computed usage merges
- Improvement path: cache hot aggregates and split endpoints by read profile

## Fragile Areas

**Entitlement enforcement path:**
- Why fragile: touches subscription plans, usage counters, place-kind mapping, and mutation permissions together
- Files: `apps/api/src/lib/plan-entitlements.ts`, `apps/api/src/lib/entitlement-evaluator.ts`, `apps/api/src/routes/owner/places.ts`
- Common failures: inconsistent quota behavior after schema/policy edits
- Safe modification: update helper tests first, then mutation handlers, then run regression on owner CRUD flows
- Test coverage: helper unit tests exist; route-level coverage is limited

**Payment + webhook lifecycle:**
- Why fragile: distributed logic across provider client, webhook verifier, and subscription route updates
- Files: `apps/api/src/lib/payment-provider.ts`, `apps/api/src/lib/iyzico-webhook.ts`, `apps/api/src/routes/subscriptions.ts`
- Common failures: status mismatch and reconciliation delays
- Safe modification: keep signature verification and status transition logic backward compatible; add end-to-end test harness
- Test coverage: helper-level tests exist, but full lifecycle tests are missing

## Scaling Limits

**Repository artifact growth from tracked uploads:**
- Current capacity issue: binary files under `apps/api/public/uploads/` are versioned
- Limit symptom: repository size and clone times increase over time
- Scaling path: move runtime upload artifacts to external storage only and stop committing generated uploads

## Dependencies at Risk

**Dual lockfile + mixed package manager workflow:**
- Risk: dependency drift between Bun lock and npm lock
- Files: `bun.lock`, `package-lock.json`, `.github/workflows/playwright.yml`
- Impact: local and CI dependency graphs can differ
- Migration plan: standardize CI on Bun or lock npm usage intentionally with synchronized update policy

## Test Coverage Gaps

**Critical API endpoint behavior mostly untested:**
- What's not tested: admin moderation routes, owner CRUD endpoints, auth/session boundaries
- Risk: regressions in production workflows without early signal
- Priority: High
- Difficulty to test: Medium (requires seeded DB + auth fixtures)

**Frontend integration flows not covered:**
- What's not tested: dashboard ownership flows, subscription checkout UX, admin workflows
- Risk: UI/data contract drift and broken user journeys
- Priority: High
- Difficulty to test: Medium to High

---

*Concerns audit: 2026-02-27*
*Update as issues are fixed or new ones discovered*

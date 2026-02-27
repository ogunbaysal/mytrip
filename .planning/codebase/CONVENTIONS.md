# Coding Conventions

**Analysis Date:** 2026-02-27

## Naming Patterns

**Files:**
- Kebab-case module files across API and frontend (`payment-provider.ts`, `dashboard-layout-client.tsx`)
- Test files use `*.test.ts` (Bun) and `*.spec.ts` (Playwright)
- App Router naming follows Next conventions (`page.tsx`, `layout.tsx`, dynamic `[slug]`)

**Functions:**
- `camelCase` for helpers and handlers (`getSessionFromRequest`, `buildIyzicoAuthorizationHeader`)
- Route-local utility functions are commonly declared near schema definitions

**Variables:**
- `camelCase` for local/runtime variables
- UPPER_CASE style for constants where present (`MAX_IMAGE_SIZE`, `DEFAULT_REGION`)

**Types:**
- `PascalCase` type aliases and interfaces (`CreateSubscriptionParams`, `IyzicoAddress`)
- Discriminated unions and literal tuples used for constrained API inputs

## Code Style

**Formatting:**
- TypeScript-first with semicolons and double quotes as dominant style in app code
- No strict repository-level Prettier config file detected; style consistency is convention-driven
- Strict TS mode enabled in base and app tsconfigs
- Style differs by app: API/web files commonly use semicolons, admin files frequently omit semicolons

**Linting:**
- Web/Admin use ESLint with Next rules (`apps/web/eslint.config.mjs`, `apps/admin/eslint.config.mjs`)
- API package uses `tsc --noEmit` as `lint` script (`apps/api/package.json`)
- Monorepo lint entrypoint: `bun run lint`

## Import Organization

**Observed Order Pattern:**
1. External imports (`hono`, `zod`, Drizzle operators)
2. Internal alias imports (`@/lib/...`) in Next apps
3. Relative imports in API (`../db/index.ts`, `./routes/...`)

**Grouping:**
- Imports are usually grouped external first then local
- Mixed use of `import type` and value imports where useful

**Path Aliases:**
- Web: `@/*` -> `apps/web/src/*`
- Admin: `@/*` -> `apps/admin/*`
- API primarily uses relative imports

## Error Handling

**Patterns:**
- Route and middleware boundaries use `try/catch` and return JSON status payloads
- Session/auth failures consistently map to `401/403`
- Validation handled via Zod schemas and validator middleware

**Error Payloads:**
- API handlers usually return `{ error, message }` style payloads
- Frontend `api.ts` helpers parse backend errors and normalize user-facing messages

## Logging

**Framework:**
- No dedicated logging library detected
- `console.log` and `console.error` used for diagnostics in API and scripts

**Patterns:**
- Route-level error logs before returning `500`
- Seeder scripts use verbose console output for progress reporting

## Comments

**When comments are used:**
- TODO markers for incomplete auth/permission behavior
- Explanations for non-obvious integration quirks (e.g., cookie forwarding, webhook timestamp format)

**TODO Pattern:**
- Plain `TODO:` comments in-place without issue IDs
- Key examples: `apps/api/src/middleware/admin-auth.ts`, `apps/api/src/routes/admin/auth.ts`

## Function Design

**Observed Style:**
- Guard clauses are common for auth/validation failures
- Complex route modules define many local helpers + schemas in a single file
- Utility modules often expose pure functions with typed IO contracts

## Module Design

**Exports:**
- Named exports are default in utility and route modules
- Default export used for app roots (`apps/api/src/index.ts`, Next layouts/pages)
- Barrel-style index files aggregate domains (`apps/api/src/routes/index.ts`, `apps/api/src/db/schemas/index.ts`)

**Design Note:**
- Some route files are large and combine schema, transformation helpers, and handlers; this is an active style pattern but increases coupling risk.
- For edits, follow local file style first (quote and semicolon choices), then preserve existing import grouping.

---

*Convention analysis: 2026-02-27*
*Update when patterns change*

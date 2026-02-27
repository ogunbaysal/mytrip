# Testing Patterns

**Analysis Date:** 2026-02-27

## Test Framework

**Runner:**
- Bun test runner (`bun:test`) for API/domain helper tests
- Playwright for E2E/browser tests (`playwright.config.ts`)

**Assertion Library:**
- Built-in `expect` from Bun test and Playwright test

**Run Commands:**
```bash
cd apps/api && bun test                         # API unit tests
cd apps/api && bun test src/lib/*.test.ts       # Targeted API test files
npx playwright test                             # Root Playwright suite
```

## Test File Organization

**Location:**
- API unit tests colocated with source under `apps/api/src/lib/`
- Playwright tests located in root `tests/`

**Naming:**
- Unit tests: `*.test.ts`
- Browser tests: `*.spec.ts`

**Structure:**
```
apps/api/src/lib/
  entitlement-evaluator.ts
  entitlement-evaluator.test.ts
  payment-provider.ts
  payment-provider.test.ts

tests/
  example.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
describe("module-name", () => {
  test("handles success", () => {
    // arrange
    // act
    // assert
  });
});
```

**Patterns:**
- `describe` + `test` blocks with straightforward arrange/act/assert
- Most tests are pure-function/unit validations
- Limited use of lifecycle hooks (`beforeEach`/`afterEach` uncommon in current set)

## Mocking

**Framework:**
- Current tests are mostly deterministic and avoid heavy mocking

**Observed Pattern:**
- Provide explicit fixture-like literals inline (payload objects for webhook/signing/entitlement cases)
- No broad dependency mocking framework usage in sampled tests

**What is tested now:**
- Signature generation/verification helpers
- Entitlement and place-kind capability logic
- Mapping/parser utilities in payment provider

## Fixtures and Factories

**Test Data Style:**
- Inline object literals per test case
- No shared `fixtures/` or `factories/` directory currently

## Coverage

**Requirements:**
- No formal coverage threshold configuration detected
- CI runs Playwright smoke suite only via `.github/workflows/playwright.yml`

**Current Reality:**
- API route integration paths are mostly untested
- Frontend unit/component tests are not present

## Test Types

**Unit Tests:**
- Concentrated in `apps/api/src/lib/*.test.ts`
- Validate pure domain logic and helper behavior

**Integration Tests:**
- Minimal; not a dominant existing pattern

**E2E Tests:**
- Playwright root tests currently target generic starter scenario (`playwright.dev`), not product flows

## Common Patterns

**Async Testing:**
- Async expectations used when needed for promise-based helpers

**Error Testing:**
- Negative-path assertions included (invalid signatures, quota exceeded)

**Snapshot Testing:**
- Not used in current repository

## Gaps To Match When Adding Tests

- Add endpoint integration tests for critical admin/owner/subscription mutations
- Add auth/session flow tests for both admin and web auth namespaces
- Replace placeholder Playwright examples with real app journeys

---

*Testing analysis: 2026-02-27*
*Update when test patterns change*

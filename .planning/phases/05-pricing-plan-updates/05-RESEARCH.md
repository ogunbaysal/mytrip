# Phase 5: pricing plan updates - Research

**Researched:** 2026-02-27
**Domain:** Pricing plans + subscription UI (Next.js web app + API plan catalog)
**Confidence:** MEDIUM

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

### Plan lineup & roles

- Pricing page order: Freemium first, then paid plans in ascending tier order.
- Rename all four plans using value-based Turkish naming.
- One paid plan is visually highlighted as “most popular/recommended.”

### Claude's Discretion

- Exact Turkish plan names and which paid plan is highlighted.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

## Summary

Phase 5 is primarily a pricing catalog + pricing page update. The web app pricing page reads plans from the API (`/api/subscriptions/plans`) and renders cards based on `sortOrder`, `features`, and `entitlements`, with a “popular” highlight tied to `plan.sortOrder === 1`. The API returns only active, yearly plans. Plan metadata and entitlements are primarily sourced from the subscription plan tables and seeded via the core seeder, with an admin plans API available for manual updates.

Freemium is possible without payment today: the subscription create endpoint only requires a payment method when the final price is above zero, and checkout already treats `finalPrice <= 0` as free. However, the pricing page button logic currently labels plans with all place entitlements at 0 as “İletişime Geç,” which will mislabel a freemium plan if its entitlements are set to zero. Plan ordering and highlight are driven by `sortOrder`, so the seeder or admin plan updates must set `sortOrder` to match the required UI order and ensure a single paid plan is marked as “most popular.”

**Primary recommendation:** Update the plan catalog (seed/admin plan data) to four yearly plans including a free tier, adjust `sortOrder` and names, and align pricing page CTA/label logic to treat freemium as selectable without payment while keeping checkout behavior intact.

## Standard Stack

### Core

| Library                 | Version      | Purpose                     | Why Standard                   |
| ----------------------- | ------------ | --------------------------- | ------------------------------ |
| Next.js                 | 15.5.7       | Web app routing/rendering   | Existing web app stack         |
| React                   | 19.2.0       | UI components               | Existing web app stack         |
| @tanstack/react-query   | current repo | Pricing/checkout data fetch | Existing data-fetching pattern |
| Tailwind v4 + shadcn/ui | current repo | Pricing page UI             | Existing UI system             |

### Supporting

| Library     | Version | Purpose                            | When to Use                         |
| ----------- | ------- | ---------------------------------- | ----------------------------------- |
| Hono        | 4.9.x   | API routes for plans/subscriptions | Plan catalog + checkout behavior    |
| Drizzle ORM | 0.44.x  | Plan + entitlement persistence     | Updating plan metadata/entitlements |

### Alternatives Considered

| Instead of                                    | Could Use            | Tradeoff                                       |
| --------------------------------------------- | -------------------- | ---------------------------------------------- |
| API-driven plans (`/api/subscriptions/plans`) | Hardcoded pricing UI | Risks data drift vs subscription system; avoid |

## Architecture Patterns

### Recommended Project Structure

```
apps/web/src/app/pricing/            # Pricing page UI
apps/web/src/app/subscribe/checkout/ # Checkout UI + freemium behavior
apps/web/src/lib/api.ts              # Plan/checkout API wrappers
apps/api/src/routes/subscriptions.ts # Public plan + subscription endpoints
apps/api/src/db/seeders/seed-core.ts # Canonical plan catalog seeding
```

### Pattern 1: Plans are API-driven and ordered by sortOrder

**What:** Pricing page queries `/api/subscriptions/plans` and renders cards ordered by `sortOrder` (DB order) while highlighting `sortOrder === 1`.
**When to use:** Any pricing plan update; keep source of truth in DB/seed or admin plan route.
**Example:**

```typescript
// Source: apps/web/src/app/pricing/page.tsx
const { data: plansData } = useQuery({
  queryKey: ["plans"],
  queryFn: () => api.subscriptions.getPlans(),
});

const plans =
  (plansData?.plans as Plan[] | undefined)?.filter(
    (plan) => plan.billingCycle === "yearly",
  ) || [];

const isPopular = plan.sortOrder === 1;
```

### Pattern 2: Plan details are hydrated via features + entitlements

**What:** API hydrates plan features and entitlement limits from related tables.
**When to use:** When updating plan limits or feature lists.
**Example:**

```typescript
// Source: apps/api/src/lib/plan-entitlements.ts
return plans.map((plan) => ({
  ...plan,
  features,
  entitlements,
  limits: {
    maxPlaces: plan.maxPlaces ?? 0,
    maxBlogs: plan.maxBlogs ?? blogEntitlement?.limitCount ?? 0,
  },
}));
```

### Pattern 3: Free checkout is allowed when final price is zero

**What:** Payment method required only if finalPrice > 0; UI treats <= 0 as free.
**When to use:** Freemium plan or 100% coupon flows.
**Example:**

```typescript
// Source: apps/api/src/routes/subscriptions.ts
if (finalPrice > 0 && !paymentMethod) {
  return c.json(
    { error: "Payment method is required when payable amount is above zero" },
    400,
  );
}
```

### Anti-Patterns to Avoid

- **Hardcoding plan cards in the UI:** breaks subscription/entitlement alignment and checkout behavior.
- **Using non-yearly billingCycle for pricing plans:** plans endpoint filters to yearly only.
- **Leaving freemium entitlements all zero without CTA adjustment:** pricing CTA will show “İletişime Geç”.

## Don't Hand-Roll

| Problem                 | Don't Build       | Use Instead                                                   | Why                                              |
| ----------------------- | ----------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| Plan catalog + ordering | Hardcoded UI list | `subscription_plan` + `sortOrder`                             | Keeps pricing aligned with checkout/subscription |
| Plan features/limits    | Custom JSON in UI | `subscription_plan_feature` + `subscription_plan_entitlement` | Existing DB + hydration logic                    |
| Free checkout logic     | New ad-hoc flag   | Existing `finalPrice <= 0` behavior                           | Already supports freemium/coupons                |

**Key insight:** Pricing UI is downstream of the plan catalog; keep plan data in the DB/seed/admin routes so entitlements and checkout remain consistent.

## Common Pitfalls

### Pitfall 1: Freemium plan shows “İletişime Geç” CTA

**What goes wrong:** The pricing CTA label checks whether all place entitlements are zero and labels it as contact-only.
**Why it happens:** Logic assumes zero entitlements means enterprise/contact plan.
**How to avoid:** Update CTA logic to treat freemium as “Ücretsiz Başla” or similar when plan.price is 0 (or a dedicated flag), and keep contact CTA for paid/enterprise-only plans.
**Warning signs:** Free plan card renders with contact CTA despite price 0.

### Pitfall 2: Plans not showing or out of order

**What goes wrong:** UI only renders active yearly plans ordered by DB sort order.
**Why it happens:** `billingCycle !== "yearly"` is filtered out and `sortOrder` controls order/highlight.
**How to avoid:** Ensure all four plans are `billingCycle: "yearly"`, `active: true`, and `sortOrder` is set to match the required order.
**Warning signs:** Pricing page shows fewer than four plans or wrong order.

### Pitfall 3: Entitlements updated but legacy limits left inconsistent

**What goes wrong:** UI displays mismatched limits (max places/blogs) or subscription usage expectations drift.
**Why it happens:** Legacy `maxPlaces`/`maxBlogs` still exist and are used in some UI paths.
**How to avoid:** Keep entitlements and legacy limits aligned when updating the catalog (seeder/admin plan updates handle this).
**Warning signs:** Checkout shows limits that don’t match entitlements/plan features.

## Code Examples

Verified patterns from official sources:

### Pricing plans query + CTA decision

```tsx
// Source: apps/web/src/app/pricing/page.tsx
{
  plan.entitlements
    .filter((item) => item.resourceKey.startsWith("place."))
    .every(
      (item) =>
        !item.isUnlimited && (item.limitCount === null || item.limitCount <= 0),
    )
    ? "İletişime Geç"
    : "Planı Seç";
}
```

### Plans API response order and filtering

```typescript
// Source: apps/api/src/routes/subscriptions.ts
const plans = await db
  .select()
  .from(subscriptionPlan)
  .where(
    and(
      eq(subscriptionPlan.active, true),
      eq(subscriptionPlan.billingCycle, "yearly"),
    ),
  )
  .orderBy(subscriptionPlan.sortOrder, desc(subscriptionPlan.createdAt));
```

## State of the Art

| Old Approach                                   | Current Approach                               | When Changed    | Impact                                          |
| ---------------------------------------------- | ---------------------------------------------- | --------------- | ----------------------------------------------- |
| Plan limits based only on `maxPlaces/maxBlogs` | Plan entitlements + features hydrated per plan | Already in repo | Pricing/usage display derives from entitlements |

**Deprecated/outdated:**

- Relying on non-yearly plans in the public pricing UI (plans endpoint filters yearly only).

## Open Questions

1. **What are the four Turkish plan names and which plan is “most popular”?**
   - What we know: Names are value-based Turkish, one paid plan highlighted.
   - What's unclear: Exact names and which plan is highlighted.
   - Recommendation: Define names + highlight in planning; update `sortOrder` and pricing copy accordingly.

2. **Is the freemium plan truly free (price 0) or free with required card?**
   - What we know: Checkout allows free when final price <= 0; payment method required only when price > 0.
   - What's unclear: Business rule for whether to collect card details for freemium.
   - Recommendation: If no card required, set price to 0 and adjust CTA/checkout copy; if card required, keep price 0 but require payment method via UI validation (new requirement).

3. **Should entitlements for freemium be zero or small positive limits?**
   - What we know: Pricing CTA labels all-zero entitlements as contact plan.
   - What's unclear: Whether freemium should allow limited listings or be strictly read-only.
   - Recommendation: Prefer small positive limits to avoid “contact” labeling, or adjust CTA logic for free tier.

## Sources

### Primary (HIGH confidence)

- `apps/web/src/app/pricing/page.tsx` - pricing UI logic and CTA labeling
- `apps/web/src/app/subscribe/checkout/checkout-content.tsx` - free checkout behavior
- `apps/api/src/routes/subscriptions.ts` - plans endpoint + checkout rules
- `apps/api/src/db/seeders/seed-core.ts` - canonical plan catalog seed
- `apps/api/src/db/schemas/subscriptions.ts` - plan/entitlement schema
- `apps/api/src/lib/plan-entitlements.ts` - plan hydration and limits

### Secondary (MEDIUM confidence)

- `apps/web/src/app/dashboard/subscription/page.tsx` - subscription UI uses plan data + features

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - derived from `.planning/codebase/STACK.md` and repo structure
- Architecture: MEDIUM - based on current pricing/plan/checkout implementation
- Pitfalls: MEDIUM - inferred from current UI/plan logic and constraints

**Research date:** 2026-02-27
**Valid until:** 2026-03-29

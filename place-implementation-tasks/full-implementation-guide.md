# Full Implementation Guide: Place Domain Redesign

## 1) Objective
Build a typed place system that supports kind-specific behavior and entitlements.

Primary business requirements:
- Hotels have rooms, room features, room prices, room images, and room reservation logic hooks.
- Villas have villa-level pricing/features/media and no room support.
- Restaurant/cafe/bar/club places support menu + average pricing.
- Beaches support content/media and optional entrance pricing.
- Natural locations support content/media.
- Activity locations support packages/menu-like pricing and media.
- Visit locations support content/media and unlimited plan quota.

## 2) Architecture Decision

### 2.1 Replace category-driven model
- Remove behavior tied to `place.categoryId` and `placeCategory.slug`.
- Introduce strict `place.kind` enum and kind profile tables.

### 2.2 Use composition, not giant optional tables
- Keep shared fields in `place`.
- Move kind-specific fields into dedicated profile tables.
- Model repeating resources in separate tables (rooms, menus, packages).

### 2.3 Subscription entitlement model
- Replace global `maxPlaces` logic with per-resource entitlements.
- `visit_location` is unlimited.

## 3) Database Implementation

## 3.1 Schema changes

### 3.1.1 Replace old place core
Current file to replace:
- `apps/api/src/db/schemas/places.ts`

Actions:
- Remove `categoryId` dependency.
- Add `kind` enum column.
- Keep shared columns only.
- Convert stringified JSON columns to typed `jsonb` where practical.

### 3.1.2 Remove place category dependency
Current file:
- `apps/api/src/db/schemas/categories.ts`

Actions:
- Remove `placeCategory` table from place flow.
- Keep blog categories unchanged.

### 3.1.3 Add place-kind profiles
Create new schema module (suggested):
- `apps/api/src/db/schemas/place-profiles.ts`

Tables:
- `place_hotel_profile`
- `place_villa_profile`
- `place_dining_profile`
- `place_beach_profile`
- `place_natural_profile`
- `place_activity_profile`
- `place_visit_profile`

Rules:
- one-to-one with `place.id`
- profile exists only for matching `place.kind`

### 3.1.4 Add hotel room domain
New schema module (suggested):
- `apps/api/src/db/schemas/place-hotel.ts`

Tables:
- `hotel_room`
- `hotel_room_media`
- `hotel_room_feature`
- `hotel_room_rate`

### 3.1.5 Add dining and activity catalogs
New schema modules (suggested):
- `apps/api/src/db/schemas/place-dining.ts`
- `apps/api/src/db/schemas/place-activity.ts`

Tables:
- Dining: `dining_menu`, `dining_menu_section`, `dining_menu_item`
- Activity: `activity_package`, optional media linkage

### 3.1.6 Refactor subscriptions for entitlements
Current file:
- `apps/api/src/db/schemas/subscriptions.ts`

Actions:
- Keep `subscription_plan` commercial fields.
- Add `subscription_plan_entitlement` table.
- Keep `maxBlogs` temporarily or move blogs to entitlements too (recommended: move).
- Remove hard dependency on `maxPlaces` from business logic.

## 3.2 Migration
- Create a new Drizzle migration replacing old place/category structures.
- Remove old category foreign keys and indexes tied to place category.
- Add new indexes on `place.kind`, `place.ownerId`, `place.status`, `place.cityId`, `place.districtId`.
- Add check constraints for invalid cross-kind resources (for example no rooms for non-hotels).

## 3.3 Seed rewrite
Current file:
- `apps/api/src/db/seeders/seed-core.ts`

Actions:
- Replace `PLACE_CATEGORIES` seed with `PLACE_KINDS` metadata seed.
- Replace plan `maxPlaces` seed with entitlement rows.
- Ensure `place.visit_location` entitlement is `unlimited=true` in all plans.

## 4) API Implementation

## 4.1 Public places API
Current file:
- `apps/api/src/routes/places.ts`

Actions:
- Remove category-based filtering and mapping logic.
- Add kind-based filters and response contracts.
- Replace `/places/categories` with `/place-kinds` or `/places/kinds`.
- Return `kindProfile` and kind-specific sections.

## 4.2 Owner places API
Current file:
- `apps/api/src/routes/owner/places.ts`

Actions:
- Replace payload validation with discriminated union by `kind`.
- Remove `categoryId`, `category`, and category fallback resolution.
- Introduce nested subresource endpoints:
  - `/owner/places/:id/rooms*`
  - `/owner/places/:id/menu*`
  - `/owner/places/:id/packages*`
- Replace `checkPlaceLimit` with entitlement service call by `kind`.

## 4.3 Admin places API
Current file:
- `apps/api/src/routes/admin/places.ts`

Actions:
- Remove category and legacy type mapping.
- Add kind-specific read/write and moderation validations.
- Update stats endpoint aggregation from category mapping to `place.kind`.

## 4.4 Subscription APIs
Current files:
- `apps/api/src/routes/subscriptions.ts`
- `apps/api/src/routes/admin/plans.ts`
- `apps/api/src/routes/admin/subscriptions.ts`

Actions:
- Replace plan limits payload (`maxPlaces`) with entitlement map.
- Update usage endpoint to return per-resource usage values.
- Update plan creation/update payloads for entitlement CRUD.

## 4.5 Shared service layer
Create shared services (suggested):
- `apps/api/src/lib/place-kind-registry.ts`
- `apps/api/src/lib/place-entitlements.ts`
- `apps/api/src/lib/place-kind-validators.ts`

These services prevent duplicated kind logic in public/owner/admin routes.

## 5) Web App Implementation (`apps/web`)

## 5.1 API client updates
Current file:
- `apps/web/src/lib/api.ts`

Actions:
- Replace category fields with `kind` + `kindProfile`.
- Update place summary/detail mappers.
- Update owner place endpoints and payload types.
- Update subscription plan and usage contracts for entitlements.

## 5.2 Traveler discovery and detail pages
Likely impacted files:
- `apps/web/src/app/places/page.tsx`
- `apps/web/src/app/places/[slug]/page.tsx`
- `apps/web/src/components/places/*`

Actions:
- Replace category filters with kind filters.
- Render kind-specific detail sections via module registry.
- Remove assumptions that all places have nightly room pricing.

## 5.3 Owner dashboard place forms
Likely impacted files:
- `apps/web/src/app/dashboard/places/create/page.tsx`
- `apps/web/src/app/dashboard/places/[id]/edit/page.tsx`
- `apps/web/src/app/dashboard/places/page.tsx`

Actions:
- Step 1: select `kind`.
- Step 2+: dynamic form sections by kind module.
- Extract reusable components:
  - `PlaceBaseFieldsForm`
  - `PlaceMediaUploader`
  - `PlaceLocationSection`
  - `PlaceContactSection`
  - `KindSpecificFormRenderer`
- Add kind switch confirmation and revalidation on edit.

## 5.4 Subscription screens
Likely impacted files:
- `apps/web/src/app/pricing/page.tsx`
- `apps/web/src/app/dashboard/subscription/page.tsx`

Actions:
- Display entitlement rows by place kind.
- Show unlimited indicator for `visit_location`.
- Update usage progress to multi-resource cards.

## 6) Admin App Implementation (`apps/admin`)

## 6.1 Admin hooks and models
Likely impacted files:
- `apps/admin/hooks/use-places.ts`
- `apps/admin/types/subscriptions.ts`

Actions:
- Replace category-centric place type model with `kind` contracts.
- Update subscription plan typing to entitlements.

## 6.2 Place create/edit pages
Likely impacted files:
- `apps/admin/app/(dashboard)/places/create/page.tsx`
- `apps/admin/app/(dashboard)/places/[id]/edit/page.tsx`
- `apps/admin/components/tables/places-table.tsx`

Actions:
- Implement same kind module system as web owner dashboard.
- Show kind-specific moderation fields.
- Keep shared reusable UI components in `components/place-modules/*`.

## 6.3 Plan management UI
Likely impacted files:
- `apps/admin/components/forms/plan-form.tsx`
- `apps/admin/app/(dashboard)/subscriptions/plans/*`

Actions:
- Replace `maxPlaces` input with entitlement editor.
- Add `unlimited` toggle for `visit_location`.

## 7) SOLID Component Strategy

## 7.1 Shared domain contracts
Create a single contract package (or shared folder) for place kind definitions:
- place kinds enum
- kind form DTOs
- validation schemas
- API DTOs

## 7.2 Open/closed registry
Use a `placeKindRegistry` object in web/admin/api to map:
- schema
- transformers
- renderers
- permission checks

Adding a new kind should require adding a module, not rewriting core flows.

## 8) Testing Strategy

## 8.1 API tests
Priorities:
- kind-specific create/update validation
- entitlement enforcement per kind
- visit unlimited behavior
- owner kind-change revalidation
- room/menu/package CRUD constraints

## 8.2 UI tests
Priorities:
- owner create/edit flows per kind
- admin moderation rendering per kind
- traveler place detail rendering per kind
- pricing/subscription usage UI for entitlements

## 8.3 Manual QA scenarios
Required scenarios:
- Hotel with multiple rooms + rates
- Villa with no room UI
- Restaurant with menu items
- Beach with entrance pricing
- Activity with package pricing
- Visit location creation beyond standard paid limits

## 9) Rollout Plan
- Phase A: DB migration + seed rewrite in a clean environment
- Phase B: API contracts and integration tests
- Phase C: Web owner + traveler updates
- Phase D: Admin updates
- Phase E: full regression pass and deployment

## 10) Risks and Controls
- Risk: cross-kind data leakage
  - Control: strict schema + service-level guards + endpoint-level validation
- Risk: quota miscount
  - Control: central entitlement service and query-level tests
- Risk: UI drift between web/admin
  - Control: shared kind registry and shared components where possible

## 11) Definition of Done
- Category-based place logic removed from schema/routes/UI.
- Kind-specific place behavior fully implemented.
- Entitlement model replaces global place limits.
- Visit locations are unlimited by plan policy.
- All place and subscription endpoints updated.
- Web and Admin are production-ready on the new contracts.

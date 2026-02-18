# Product Requirements Document (PRD) - TatilDesen

## 1) Document Scope
This PRD defines the target product and system design for the place domain redesign as of February 15, 2026.

This version intentionally replaces the old category-centric place model. Backward compatibility is not required for this redesign.

## 2) Executive Summary
TatilDesen will move from a generic `place + category` model to a typed place domain where each place kind has its own profile and behavior.

Core decisions:
- Remove category-driven place behavior as the primary modeling strategy.
- Introduce explicit `placeKind` as a first-class domain concept.
- Model kind-specific data in dedicated profile tables.
- Introduce entitlement-based subscription limits by monetized place kinds.
- Keep `visit` places unlimited for owners.
- Update API, Web, and Admin end-to-end to the new contracts.

## 3) Product Goals
- Allow accurate modeling of operationally different businesses (hotel vs villa vs restaurant vs beach vs activity vs visit).
- Prevent invalid UX combinations (for example, no room UI on villas).
- Provide clean subscription enforcement by business type.
- Improve maintainability via explicit domain boundaries and reusable UI modules.

## 4) Personas
- Traveler (P0): Discovers places and views kind-specific details.
- Owner (P0): Creates and manages places based on business type.
- Admin/Operations (P0): Moderates type-specific content and controls plan policies.

## 5) Domain Redesign

### 5.1 Place Kind Taxonomy
`placeKind` is an enum and not a soft category string.

Initial supported kinds:
- `hotel`
- `villa`
- `restaurant`
- `cafe`
- `bar_club`
- `beach`
- `natural_location`
- `activity_location`
- `visit_location`

Optional future extension:
- `other_monetized` for new paid/rentable kinds without schema churn.

### 5.2 Capability Matrix
Required product capabilities by kind:

- `hotel`
  - Base place info + media
  - Room inventory
  - Room features
  - Room images
  - Room pricing and reservation logic hooks
- `villa`
  - Base place info + media
  - Villa-level pricing and features
  - No room entities
- `restaurant` / `cafe` / `bar_club`
  - Base place info + media
  - Menu structure
  - Average price / price band
- `beach`
  - Base place info + media
  - Optional entrance fee
  - Content-oriented details
- `natural_location`
  - Base place info + media
  - Content-oriented details
- `activity_location`
  - Base place info + media
  - Activity pricing packages (menu-like)
- `visit_location`
  - Base place info + media
  - Content-oriented details
  - Unlimited plan quota

### 5.3 Data Modeling Strategy
Use composition over overloaded columns:
- One core `place` table for shared fields.
- One profile table per kind for specific fields.
- Dedicated sub-resource tables where needed (rooms, menus, packages).

Rationale:
- Prevents sparse, invalid columns in a single wide table.
- Allows strict validation and clean API contracts per kind.
- Keeps UI rendering and forms deterministic by kind.

### 5.4 Proposed DB Schema (High Level)

Core tables:
- `place`
  - `id`, `slug`, `name`, `kind`, `status`, `ownerId`, `cityId`, `districtId`, `location`, `contactInfo`, `description`, `shortDescription`, `verified`, `featured`, timestamps
- `place_media`
  - replaces generic image linkage for cleaner ordering and metadata
- `place_tag` (optional)
  - discovery tags not tied to behavior

Kind profile tables (1:1 with `place`):
- `place_hotel_profile`
- `place_villa_profile`
- `place_dining_profile` (restaurant/cafe/bar_club)
- `place_beach_profile`
- `place_natural_profile`
- `place_activity_profile`
- `place_visit_profile`

Hotel sub-resources:
- `hotel_room`
- `hotel_room_media`
- `hotel_room_feature`
- `hotel_room_rate` (seasonal/date-range pricing)
- `hotel_reservation_policy` (for future booking logic)

Dining sub-resources:
- `dining_menu`
- `dining_menu_section`
- `dining_menu_item`

Activity sub-resources:
- `activity_package`
- `activity_package_media` (optional)

Important constraint rules:
- Exactly one profile row matching `place.kind`.
- No room records unless `place.kind = hotel`.
- No dining menu unless `place.kind in (restaurant, cafe, bar_club)`.
- No activity packages unless `place.kind = activity_location`.

## 6) Subscription and Entitlements Redesign

### 6.1 Problem in Current Model
Current plan limits rely on `maxPlaces` globally, which cannot represent per-kind business policy.

### 6.2 Target Model
Move from aggregate limits to entitlement rows.

New structures:
- `subscription_plan`
  - keep commercial metadata (`name`, `price`, `currency`, `billingCycle`, `active`)
- `subscription_plan_entitlement`
  - `planId`, `resourceKey`, `limitCount`, `isUnlimited`

Resource keys:
- `place.hotel`
- `place.villa`
- `place.restaurant`
- `place.cafe`
- `place.bar_club`
- `place.beach`
- `place.natural_location`
- `place.activity_location`
- `place.other_monetized`
- `place.visit_location` (set `isUnlimited = true`)
- `blog.post`

### 6.3 Enforcement Rules
- On owner create/update of place kind:
  - Resolve active subscription.
  - Read entitlement for target `resourceKey`.
  - Count owner usage for that resource.
  - Allow if `isUnlimited` or usage < limit.
- Place kind change must revalidate entitlements.
- Deleting places decrements usage naturally by query count.

### 6.4 Usage API Shape
`GET /api/subscriptions/usage` should return per-resource usage map, not only totals:
- `usage.resources[resourceKey] = { current, max, unlimited }`

## 7) API Redesign (No Backward Compatibility)

### 7.1 Public API
Replace category-oriented filters and responses.

Required endpoints:
- `GET /api/place-kinds`
- `GET /api/places?kind=&city=&district=&priceMin=&priceMax=&...`
- `GET /api/places/:slug`
- `GET /api/places/featured`
- `GET /api/places/cities`

Response principle:
- shared fields in `place`
- `kindProfile` object for kind-specific payload
- include only valid fields for that kind

### 7.2 Owner API
- `GET /api/owner/place-kinds`
- `POST /api/owner/places`
- `GET /api/owner/places/:id`
- `PUT /api/owner/places/:id`
- `DELETE /api/owner/places/:id`
- `POST /api/owner/places/:id/submit`

Kind-specific nested resources:
- `hotel`: `/api/owner/places/:id/rooms*`
- `dining`: `/api/owner/places/:id/menu*`
- `activity`: `/api/owner/places/:id/packages*`

Validation principle:
- Contract discriminated by `kind`.
- Reject payload fields that do not belong to that kind.

### 7.3 Admin API
- Mirror owner model with elevated permissions and moderation actions.
- Admin list/stats must aggregate by `place.kind`.
- Admin approvals must include kind-specific completeness checks.

### 7.4 Subscription API
Plan APIs return entitlements instead of only `maxPlaces`:
- `GET /api/subscriptions/plans`
- `GET /api/subscriptions/current`
- `GET /api/subscriptions/usage`

Admin plan management updates entitlements:
- `GET/POST/PUT/DELETE /api/admin/plans`
- entitlement editor in payload

## 8) Frontend Architecture Requirements (Web + Admin)

### 8.1 SOLID and Reuse Rules
- Single Responsibility: split shared base form from kind-specific form modules.
- Open/Closed: register new place kinds by adding kind module, not rewriting core flow.
- Liskov: every kind module implements the same interface contract.
- Interface Segregation: small prop contracts for media, pricing, location, contact blocks.
- Dependency Inversion: page-level orchestrators depend on kind module interfaces.

### 8.2 Required UI Composition Pattern
Define a `PlaceKindModule` contract with:
- `validationSchema`
- `defaultValues`
- `toApiPayload`
- `fromApiPayload`
- `FormSections`
- `DetailSections`

Create registries:
- `web`: owner create/edit + traveler detail renderer
- `admin`: create/edit/moderation renderer

### 8.3 Shared Components to Extract
Shared blocks across Web/Admin:
- media upload gallery
- location picker + map
- contact information block
- pricing block variants
- feature/tag selector
- business document panel
- status and moderation panel

### 8.4 UX Rules
- Kind is selected first in create flow and becomes the form driver.
- Changing kind in edit flow requires confirmation and revalidation.
- Detail page renders only sections valid for the place kind.

## 9) Migration and Seeding Strategy

### 9.1 Migration Policy
- Clean migration only.
- No compatibility aliases.
- Remove old category dependencies from DB and API contracts.

### 9.2 Seed Policy
Seeders must define:
- place kinds metadata
- entitlement-enabled subscription plans
- default entitlements where `visit_location` is unlimited
- optional starter templates for room/menu/package data

### 9.3 Rollout Sequence
- Update DB schema and seeders first.
- Update API contracts second.
- Update Web and Admin third.
- Run full QA and scenario validation last.

## 10) Non-Functional Requirements
- Performance: indexed filtering by `kind`, `cityId`, `districtId`, `status`, `featured`.
- Data integrity: hard constraints for kind/profile consistency.
- Security: role-checked owner/admin mutations.
- Reliability: transactional writes for place + profile + subresources.
- Observability: structured logs around entitlement denials and validation failures.

## 11) Acceptance Criteria
- Owners can create each place kind with only valid fields.
- Hotels support rooms/rates; villas do not expose room APIs/UI.
- Dining places support menu APIs/UI.
- Activity places support package pricing APIs/UI.
- Visit locations are unlimited regardless of other place limits.
- Subscription usage endpoint returns per-resource usage accurately.
- Admin can moderate all place kinds with correct detail rendering.
- Public place detail renders kind-specific sections correctly.

## 12) Delivery Phases
- Phase 1: Schema + migration + seed redesign.
- Phase 2: API redesign for places and subscriptions.
- Phase 3: Web owner dashboard and traveler place experience update.
- Phase 4: Admin panel update.
- Phase 5: QA hardening, analytics updates, and production rollout.

## 13) External Reference Patterns Used
- Sharetribe listing-type and custom-field strategy for multi-type marketplaces.
- Booking.com room-type and rate-plan separation for accommodation modeling.
- Stripe entitlements model for feature/limit-based access control.
- PostgreSQL inheritance caveats used to avoid table-inheritance coupling.
- Drizzle ORM schema patterns for enums, one-to-one relations, jsonb, and check constraints.

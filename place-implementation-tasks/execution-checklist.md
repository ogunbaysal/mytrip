# Execution Checklist

## Phase 1: Data Layer
- [x] Replace `apps/api/src/db/schemas/places.ts` with `place.kind` core model.
- [x] Remove place-category dependency from schema exports.
- [x] Add kind profile schema modules.
- [x] Add hotel room/rate schema modules.
- [x] Add dining menu schema modules.
- [x] Add activity package schema modules.
- [x] Add plan entitlement schema and relation exports.
- [x] Generate and review migration SQL.
- [x] Rewrite `apps/api/src/db/seeders/seed-core.ts` for kinds + entitlements.

## Phase 2: API Layer
- [x] Refactor `apps/api/src/routes/places.ts` to kind-driven contracts.
- [x] Refactor `apps/api/src/routes/owner/places.ts` with discriminated payloads.
- [x] Add owner nested endpoints for rooms/menu/packages.
- [x] Refactor `apps/api/src/routes/admin/places.ts` to kind-driven moderation.
- [x] Update subscription routes to entitlement contracts.
- [x] Update admin plan routes for entitlement CRUD.
- [x] Add reusable entitlement service and kind registry in `apps/api/src/lib/*`.
- [x] Add API tests for kind validation and entitlement enforcement.

## Phase 3: Web App
- [x] Update `apps/web/src/lib/api.ts` types and mappers.
- [x] Update traveler list/detail pages for kind-specific rendering.
- [x] Build owner place create/edit kind module renderer.
- [x] Extract reusable base components for media/location/contact/pricing blocks.
- [x] Update dashboard subscription page for entitlement usage display.
- [x] Update pricing page to display per-kind limits and unlimited visit policy.

## Phase 4: Admin App
- [x] Update place hooks and models to `kind` contract.
- [x] Refactor admin place create/edit forms with shared kind modules.
- [x] Update places table filters from category to kind.
- [x] Update plan form for entitlement editing.
- [x] Update subscription pages to consume entitlement payloads.

## Phase 5: QA and Release
- [x] Run API type-check and lint.
- [ ] Run web/admin type-check and lint.
- [ ] Execute full manual scenario matrix by kind.
- [x] Verify `visit_location` unlimited behavior with > plan limits.
- [x] Verify hotel-only room APIs are blocked for non-hotel kinds.
- [x] Verify quota checks on kind change.
- [x] Validate seed idempotency in clean DB.
- [x] Prepare rollout notes with migration steps and rollback strategy.

## Sign-off Gates
- [ ] Product sign-off on capability matrix.
- [ ] Backend sign-off on migration and API contracts.
- [ ] Frontend sign-off on web/admin parity.
- [ ] QA sign-off on critical journey coverage.

# Rollout Notes: Place Kind + Entitlement Migration

## Scope
- Place domain moved from category-centric model to `place.kind`.
- Subscription plan limits moved to entitlement rows (`subscription_plan_entitlement`).
- Owner/admin/web clients now consume kind-aware and entitlement-aware contracts.

## Pre-Deploy Checklist
1. Confirm migration files are generated and committed from `apps/api/src/db/migrations`.
2. Confirm seed files include place kinds + plan entitlements (`seed-core.ts`).
3. Confirm API and frontend env vars are set for target environment.
4. Confirm API and web/admin type-check passes on release branch.

## Deployment Steps
1. Deploy API with migrations disabled.
2. Put write operations into maintenance mode (owner/admin write paths).
3. Run database migration:
   - `cd apps/api`
   - `bun run db:migrate`
4. Run clean seed:
   - `cd apps/api`
   - `bun run db:seed`
5. Deploy API with new routes enabled.
6. Deploy web + admin applications.
7. Remove maintenance mode.

## Post-Deploy Verification
1. Create one place per kind from owner dashboard.
2. Confirm room endpoints work only for `hotel`.
3. Confirm menu endpoints work only for dining kinds.
4. Confirm package endpoints work only for `activity_location`.
5. Confirm `visit_location` creation remains allowed beyond paid-kind limits.
6. Confirm pricing page shows per-kind limits and `visit_location` as unlimited.

## Rollback Strategy
1. Re-enable maintenance mode.
2. Roll back web/admin to previous stable deployment.
3. Roll back API to previous stable deployment.
4. Restore database from pre-migration snapshot.
5. Re-run smoke checks on legacy environment.

## Notes
- This release intentionally has no backward compatibility layer.
- Database snapshot before migration is mandatory for safe rollback.

# Admin Auth Data Model Migration

These notes cover the one-time changes required to introduce dedicated admin tables for the operations console.

## Prerequisites
- Ensure `DATABASE_URL` points at the target Postgres instance (`.env` already loads this for Bun).
- Back up the `users` table before running the migration.
- Stop any workers writing to `users` to avoid race conditions.

## Migration Steps
1. Install dependencies and generate SQL (optional for local verification):
   ```bash
   bun install
   DATABASE_URL=postgres://USER:PASS@HOST:PORT/DB bun run --cwd packages/database db:generate
   ```
2. Apply migrations against the target database:
   ```bash
   DATABASE_URL=postgres://USER:PASS@HOST:PORT/DB bun run --cwd packages/database db:migrate
   ```
3. The migration performs the following automatically:
   - Creates `admins`, `admin_accounts`, `admin_sessions`, `admin_verification_tokens`.
   - Copies existing `users` with `user_type = 'admin'` into `admins` (status `pending` is mapped to `invited`).
   - Removes the legacy `admin` value from `user_type`.
4. After migrate, verify:
   - `admins` contains the expected super-admin(s).
   - `users.user_type` no longer allows `admin`.
   - Application seed script (`bun run --cwd packages/database db:seed`) succeeds.

## Rollback Plan
If a rollback is required:
1. Restore the database backup taken before the migration, or
2. Manually reinsert admins into `users` and reintroduce the `admin` enum value. (Preferred approach is full DB restore.)

Record migration completion and any anomalies in `docs/onboarding` for future hires.

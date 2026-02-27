# Phase 4: User Setup Required

**Generated:** 2026-02-27
**Phase:** 04-lets-implement-forget-password-flow-and-google-login-flow
**Status:** Incomplete

Complete these items for the integration to function. Claude automated everything possible; these items require human access to external dashboards/accounts.

## Environment Variables

| Status | Variable               | Source                                                                      | Add to                   |
| ------ | ---------------------- | --------------------------------------------------------------------------- | ------------------------ |
| [ ]    | `GOOGLE_CLIENT_ID`     | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs | `.env` / `apps/api/.env` |
| [ ]    | `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs | `.env` / `apps/api/.env` |
| [ ]    | `SMTP_HOST`            | SMTP provider dashboard                                                     | `.env` / `apps/api/.env` |
| [ ]    | `SMTP_PORT`            | SMTP provider dashboard                                                     | `.env` / `apps/api/.env` |
| [ ]    | `SMTP_USER`            | SMTP provider dashboard                                                     | `.env` / `apps/api/.env` |
| [ ]    | `SMTP_PASS`            | SMTP provider dashboard                                                     | `.env` / `apps/api/.env` |
| [ ]    | `SMTP_FROM`            | Verified sender identity                                                    | `.env` / `apps/api/.env` |

## Dashboard Configuration

- [ ] **Register OAuth redirect URI**
  - Location: Google Cloud Console → APIs & Services → Credentials
  - Add redirect URI: `{API_BASE_URL}/api/web/auth/callback/google`

## Verification

After completing setup, verify with:

```bash
bunx turbo run type-check --filter=api
```

Expected results:

- Type-check passes without errors

---

**Once all items complete:** Mark status as "Complete" at top of file.

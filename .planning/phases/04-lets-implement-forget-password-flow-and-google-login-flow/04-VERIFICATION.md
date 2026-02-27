---
phase: 04-lets-implement-forget-password-flow-and-google-login-flow
verified: 2026-02-27T18:17:57Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Forgot password request sends reset email"
    expected: "Submitting /forgot-password triggers Better Auth reset email via SMTP and user sees success toast"
    why_human: "SMTP delivery + Better Auth behavior require live env and cannot be confirmed statically"
  - test: "Reset password with invalid token"
    expected: "Opening /reset-password?token=INVALID_TOKEN shows error state and prompts new link"
    why_human: "UI state handling and Better Auth error mapping need runtime verification"
  - test: "Google sign-in flow"
    expected: "Clicking Google sign-in on /login redirects to Google OAuth and returns to app"
    why_human: "External OAuth flow requires configured Google credentials"
---

# Phase 4: Lets implement forget password flow and google login flow Verification Report

**Phase Goal:** Web users can reset their password and sign in with Google via the existing Better Auth web namespace.
**Verified:** 2026-02-27T18:17:57Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                | Status     | Evidence                                                                                                                   |
| --- | -------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | Password reset requests for web users trigger an email send attempt. | ✓ VERIFIED | `apps/api/src/lib/web-auth.ts` uses `sendResetPassword` and calls `sendPasswordResetEmail` in `apps/api/src/lib/email.ts`. |
| 2   | Google OAuth is enabled for the web auth namespace.                  | ✓ VERIFIED | `apps/api/src/lib/web-auth.ts` includes `socialProviders.google` with `GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET`.             |
| 3   | Web users can request a password reset from the login flow.          | ✓ VERIFIED | `/login` links to `/forgot-password`; `/forgot-password` calls `authClient.requestPasswordReset` with redirect.            |
| 4   | Users can set a new password using a tokenized reset link.           | ✓ VERIFIED | `/reset-password` reads `token` and calls `authClient.resetPassword` with form validation and error state.                 |
| 5   | Users can start Google login from the login page.                    | ✓ VERIFIED | `/login` has Google button calling `authClient.signIn.social({ provider: "google" })`.                                     |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                                    | Expected                                              | Status     | Details                                                                         |
| ------------------------------------------- | ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `apps/api/src/lib/web-auth.ts`              | Better Auth web config with reset + Google provider   | ✓ VERIFIED | `sendResetPassword` wired to email helper; `socialProviders.google` configured. |
| `apps/api/src/lib/email.ts`                 | SMTP email sender utility for reset emails            | ✓ VERIFIED | Nodemailer transport with SMTP envs and `sendPasswordResetEmail`.               |
| `apps/api/.env.example`                     | Documented SMTP + Google env vars                     | ✓ VERIFIED | Includes `GOOGLE_CLIENT_ID/SECRET` and SMTP variables.                          |
| `.env.example`                              | Documented SMTP + Google env vars                     | ✓ VERIFIED | Includes `GOOGLE_CLIENT_ID/SECRET` and SMTP variables.                          |
| `apps/web/src/app/forgot-password/page.tsx` | Forgot password form and reset email request          | ✓ VERIFIED | Uses `authClient.requestPasswordReset` mutation and success/error toasts.       |
| `apps/web/src/app/reset-password/page.tsx`  | Reset password form that submits token + new password | ✓ VERIFIED | Reads token/error, validates, calls `authClient.resetPassword`.                 |
| `apps/web/src/app/login/page.tsx`           | Login page links to forgot password and Google login  | ✓ VERIFIED | “Şifremi Unuttum” link + Google button wired to `signIn.social`.                |

### Key Link Verification

| From                                        | To                                      | Via                          | Status | Details                                                   |
| ------------------------------------------- | --------------------------------------- | ---------------------------- | ------ | --------------------------------------------------------- |
| `apps/api/src/lib/web-auth.ts`              | `apps/api/src/lib/email.ts`             | `sendResetPassword` callback | WIRED  | `sendPasswordResetEmail` imported and invoked.            |
| `apps/api/src/lib/web-auth.ts`              | `GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET` | `socialProviders.google`     | WIRED  | Provider configured with env vars.                        |
| `apps/web/src/app/forgot-password/page.tsx` | `authClient.requestPasswordReset`       | mutation submit              | WIRED  | Mutation uses `authClient.requestPasswordReset`.          |
| `apps/web/src/app/reset-password/page.tsx`  | `authClient.resetPassword`              | mutation submit              | WIRED  | Mutation uses `authClient.resetPassword`.                 |
| `apps/web/src/app/login/page.tsx`           | `authClient.signIn.social`              | Google button                | WIRED  | Click handler calls `signIn.social` with provider google. |

### Requirements Coverage

| Requirement | Source Plan  | Description                                                                                       | Status      | Evidence                                                                                                                |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| AUTH-01     | 04-01, 04-02 | Web users can request a password reset email from the login flow using Better Auth web namespace. | ✓ SATISFIED | `/login` links to `/forgot-password`; `authClient.requestPasswordReset` used; `sendResetPassword` wired to SMTP helper. |
| AUTH-02     | 04-02        | Web users can set a new password using a reset token and return to login.                         | ✓ SATISFIED | `/reset-password` handles token and calls `authClient.resetPassword`, then redirects to login.                          |
| AUTH-03     | 04-01, 04-02 | Web users can sign in with Google using Better Auth web namespace.                                | ✓ SATISFIED | API `socialProviders.google` configured; login page calls `authClient.signIn.social`.                                   |

**Orphaned requirements:** None detected for Phase 4 (all plan requirements align with REQUIREMENTS.md).

### Anti-Patterns Found

None related to Phase 4 auth flows.

### Human Verification Required

1. **Forgot password request sends reset email**

   **Test:** Submit the forgot-password form with a real email.
   **Expected:** Success toast appears; SMTP email with reset link is delivered.
   **Why human:** SMTP delivery and Better Auth flow require live configuration.

2. **Reset password with invalid token**

   **Test:** Open `/reset-password?token=INVALID_TOKEN`.
   **Expected:** Error state renders and offers to request a new link.
   **Why human:** UI error handling + Better Auth token validation require runtime check.

3. **Google sign-in flow**

   **Test:** Click Google sign-in on `/login`.
   **Expected:** OAuth redirect completes and user returns authenticated.
   **Why human:** External OAuth flow depends on Google console configuration.

### Gaps Summary

No code-level gaps found. Phase goal is implemented but requires human verification of live auth flows and external integrations.

---

_Verified: 2026-02-27T18:17:57Z_
_Verifier: Claude (gsd-verifier)_

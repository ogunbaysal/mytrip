# Product Requirements Document (PRD) - TatilDesen

## 1) Document Scope
This PRD reflects the **currently implemented product** in the monorepo as of **February 15, 2026**, plus near-term product direction.

## 2) Executive Summary
TatilDesen is a travel discovery and business onboarding platform for Türkiye (with a Muğla-first content focus), composed of:
- a public traveler web app (`apps/web`),
- an owner-facing dashboard inside the same web app,
- an admin panel (`apps/admin`),
- a Bun + Hono API (`apps/api`) backed by PostgreSQL (Drizzle ORM), Better Auth, and object storage uploads.

The product is no longer static-only. Core content and operational flows are API-driven: places, collections, blog posts/comments, search, reviews, subscriptions, business registration/approval, owner CRUD, and admin moderation/operations.

## 3) Product Vision
Provide a trusted discovery and conversion platform where:
- travelers can discover curated places/content quickly,
- businesses can onboard, subscribe, and manage listings/content,
- operations can approve, moderate, and manage platform health from a dedicated admin surface.

## 4) User Personas
- **Traveler (P0):** Browses places, collections, and blog content; uses filters, maps, and search.
- **Business Owner (P0):** Registers business, subscribes, manages places/blog posts, submits content for approval.
- **Admin / Operations (P0):** Manages users, admins/roles, places, reviews, blog, subscriptions, coupons/plans, approvals, analytics, and settings.

## 5) Current Functional Scope

### 5.1 Public Web (`apps/web`)
- Home with hero, category, destinations, featured places, featured collections, and latest blogs.
- Place discovery:
  - list page with URL-driven filters and pagination,
  - map/list view,
  - type, city/district, amenities, price, featured/verified filters,
  - bounds-based map search support.
- Place detail pages with gallery/media, amenities, map context, and metadata.
- Collections:
  - listing and detail pages,
  - featured collections,
  - itinerary/tips/highlights and related place hydration.
- Blog:
  - listing with category/filters,
  - detail pages,
  - comments list + submit.
- Search and content support pages:
  - login/register/profile,
  - about/contact/support/privacy/terms/cookies/careers,
  - pricing and subscription checkout.

### 5.2 Web Auth + Profile
- Dedicated Better Auth namespace for web users at `/api/web/auth/*`.
- Session refresh endpoint at `/api/refresh-session`.
- User profile read/update (`/api/profile`, `/api/profile/update`).
- Role-aware UX for owner-protected dashboard screens.

### 5.3 Business Registration + Owner Flows (`apps/web` + `apps/api`)
- Business registration wizard (`/business/register`).
- Registration lifecycle:
  - pending / approved / rejected handling,
  - business profile update endpoint for approved owners.
- Owner dashboard modules (`/dashboard/*`):
  - overview (subscription + usage),
  - place management (list/create/edit/delete/submit),
  - blog management (list/create/edit/delete/publish),
  - subscription management.
- Uploads for owner content and business documents via `/api/owner/upload`.

### 5.4 Subscription & Billing Domain
- Public subscription APIs:
  - plans,
  - current subscription,
  - coupon validation,
  - create/cancel subscription,
  - usage reporting.
- Coupon scope and redemption accounting implemented in schema/routes.
- Payment provider interface exists; current implementation uses a mocked Iyzico provider flow.

### 5.5 Admin Panel (`apps/admin`)
- Admin login + protected dashboard.
- CRUD/management surfaces implemented for:
  - admins and roles,
  - users,
  - places,
  - categories,
  - blog posts/categories/comments,
  - subscriptions/plans/coupons/payments,
  - approvals (business registrations and owner place submissions),
  - analytics,
  - settings.
- File upload support via `/api/admin/upload`.

### 5.6 API Surface (`apps/api`)
- Public APIs: `places`, `collections`, `blog`, `reviews`, `search`.
- Operational APIs: `business`, `subscriptions`, `profile`, `locations`, `refresh-session`.
- Owner APIs: `owner/places`, `owner/blogs`, `owner/upload`.
- Admin APIs: `admin/*` domains for auth, operations, moderation, approvals, analytics, content, subscription stack.
- Auth split:
  - admin auth: `/api/auth/*`,
  - web auth: `/api/web/auth/*`.

## 6) Data & Platform Architecture
- **Monorepo:** Turborepo with `apps/web`, `apps/admin`, `apps/api`.
- **Database:** PostgreSQL + Drizzle schema modules:
  - auth (admin + web users + sessions/accounts),
  - places + amenities + media,
  - collections,
  - blog + categories + images + comments,
  - reviews,
  - bookings,
  - subscriptions + plans/features + coupons + payments + redemptions,
  - business registration/profile,
  - locations,
  - settings,
  - analytics events,
  - files.
- **Uploads/Object Storage:** S3-compatible storage (MinIO envs currently used).
- **Frontend Data Layer:** TanStack Query in both web and admin apps.

## 7) Non-Functional Requirements
- **Performance:** list endpoints paginated; frontend query caching via TanStack Query; image/media hydration optimized by mapping file IDs.
- **Security:** Better Auth session cookies, CORS allowlist, admin route middleware, role/status checks on protected operations.
- **Reliability:** graceful API error messaging in web/admin API clients; fallback parsing for JSON payload inconsistencies.
- **Localization:** Turkish-first UX/content with language fields in blog domain (`tr`, `en`).

## 8) Known Gaps / Risks
- Automated tests are currently minimal/absent for critical API and UI domains.
- Payment integration is mocked (no live gateway completion yet).
- Some routes retain backward-compat alias fields during schema migration (technical debt).
- Admin frontend uses mixed API calling styles (absolute base URL client + some relative fetches), which can produce environment-specific behavior.
- Analytics “quick actions” UI elements include placeholders and are not all wired to explicit actions.

## 9) Success Metrics (Next Iteration)
- Traveler conversion:
  - place detail CTR from listing/home,
  - checkout starts from pricing,
  - business registration completion rate.
- Owner activation:
  - approved registration rate,
  - first place published,
  - first blog submitted.
- Ops efficiency:
  - median approval time (business/place),
  - moderation backlog size,
  - failed admin action rate.
- Platform quality:
  - API error rate,
  - P95 list endpoint latency,
  - upload success rate.

## 10) Near-Term Roadmap
- Harden and test owner/admin critical flows (subscriptions, approvals, upload, moderation).
- Complete live payment gateway implementation and reconciliation.
- Standardize API access patterns across admin and web frontends.
- Expand analytics/reporting from event ingestion to decision-ready dashboards.
- Add deeper QA coverage (API integration tests + frontend smoke tests).

## 11) Open Product Questions
- Which conversion event is the primary north-star in the next quarter: subscription purchase, approved business onboarding, or traveler lead actions?
- Should travelers have authenticated booking creation in the immediate roadmap, or remain discovery-first?
- What SLA should be enforced for business/place approval workflows?
- Which admin actions require stricter RBAC granularity beyond current role checks?

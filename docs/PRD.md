# Product Requirements Document (PRD) — MyTrip

## 1) Executive Summary
- MyTrip is a curated travel discovery platform for Muğla, Türkiye, highlighting premium stays, dining, and experiences through a visually rich, map-enabled web app (Next.js 15).
- Current build delivers static, editor-curated content (places, collections, blog stories) with location-aware filtering and detailed itineraries; API layer exists primarily for authentication and is not yet wired to dynamic listings.
- Goal: validate traveler demand and concierge/lead capture in Muğla, then scale with real inventory, owner onboarding, and admin operations.

## 2) Product Vision
Deliver a trusted, local-first discovery and planning companion for Muğla that surfaces a small, high-quality set of vetted stays and experiences, pairs them with ready-to-use itineraries, and offers human or digital concierge handoff.

## 3) Target Users / Personas
- **Premium Leisure Traveler (P0)**: 28–45, urban professional/couple, mid-high spend, wants tasteful, low-effort curation; values trust, design, and local tips.
- **Boutique Host / Experience Operator (P1)**: Villa/hotel/restaurant/experience owner seeking qualified demand and higher ADR via better storytelling; needs easy onboarding and guidance.
- **MyTrip Operations (P0)**: Small internal team curating listings, managing content, and handling concierge inquiries; needs simple tooling and approvals.

## 4) Problem Statement
Travelers struggle to find trustworthy, design-forward stays and authentic experiences in Muğla without sifting through noisy marketplaces. Local hosts lack a premium channel to reach the right guests. MyTrip must provide a high-signal catalog, clear itineraries, and low-friction contact paths while keeping operational overhead low.

## 5) Solution Overview
- **Traveler Web (apps/web, Next.js 15)**: Home discovery (hero, categories), featured places, map-enabled search, filtered results, rich place detail pages, curated collections with itineraries, and an editorial blog. Contact/support pages exist for lead capture (currently static).
- **API (apps/api, Hono + Better Auth)**: Authentication scaffold (email + verification) with Postgres/Drizzle schema for users/sessions/accounts; no live listings endpoints yet.
- **Admin / Dashboard (apps/admin & apps/dashboard)**: Placeholder Next.js apps; not implemented.
- **Data model (web)**: Place summaries and details, collections with itineraries, and blog posts seeded as static content; API URL env var enables swapping to live data when ready.
- **Maps & Localization**: Leaflet + OSM tiles for geospatial context; UI/content primarily Turkish, with English planned.

## 6) Success Metrics (MVP validation, 90 days)
- 1.5k+ monthly unique visitors; 30%+ click-through from home to place detail.
- 20%+ of place-detail visitors engage with contact/CTA (scroll to price/CTA, click-out, or form start).
- <3s LCP on core pages; <1% client error rate across API calls.
- Content trust: avg. rating proxy ≥4.7 on featured set (until real reviews exist, use qualitative feedback/NPS ≥45).

## 7) Feature Requirements
| Feature | Description | User Benefit | Acceptance Criteria | Priority |
| --- | --- | --- | --- | --- |
| Home discovery | Hero, category pills, featured places/collections with Muğla focus | Fast path to inspiration without searching | Page loads with curated sections; links deep-link to listings/collections; responsive layout | P0 |
| Search & filters | Location text, stay type selector, optional dates/guests; updates list | Quickly narrows to relevant stays/experiences | Filters persist in store; results reflect type/location; empty-state shown when none match | P0 |
| Map browse | Leaflet/OSM map with pins for current result set | Geospatial confidence and context | Map fits bounds of results; clicking pin shows name/location; works on mobile/desktop | P0 |
| Place listing page | Card grid with price, rating, location tag | Scannable comparison of options | Cards render data and link to `/places/[slug]`; loading/empty states present; responsive grid | P0 |
| Place detail page | Hero, highlights, gallery, amenities, map, nearby suggestions, price card, reservation calendar UI | Rich confidence to inquire/book | Static detail renders for all seeded slugs; map centers on coordinates; CTA visible; nearby/collections sections show when data exists | P0 |
| Collections | Listing page + detail pages with highlights, itinerary, tips, and featured places | Ready-made plans to reduce planning time | All seeded collection slugs resolve; itinerary/tips display; related places link correctly | P0 |
| Blog | Category filter (rehber/deneyim/gurme/mikrotrend), hero story, list of posts | Brand credibility and SEO surface | Category filter works; posts sorted by date; cards link (static for now) | P1 |
| Contact & Support | Static contact cards and FAQ; form UI | Lead capture and reassurance | Pages render; mailto/WhatsApp links work; form UI present (submission not yet wired) | P1 |
| Authentication (API) | Better Auth email/password with verification; Drizzle schema for auth tables | Foundation for gated owner/admin flows | Auth routes mount under `AUTH_BASE_PATH`; secrets required; db adapter configured; email sending stubbed in non-prod | P1 |
| Internationalization (planned) | Turkish primary; English fallback planned | Serve domestic + intl users | Turkish content default; ability to extend to English without breaking routes | P2 |

## 8) Non-Functional Requirements
- **Performance**: Core pages LCP <3s on 4G; map loading non-blocking; image optimization via Next Image.
- **Reliability**: Graceful fallback to static data when API URL missing; handle empty/error states in queries.
- **Security & Privacy**: TLS in production; auth secrets required; no PII persisted in client state; forms should avoid collecting sensitive data until backend is ready.
- **Compliance**: Prepare for KVKK/GDPR (consent for tracking, data deletion flow) before enabling analytics or persistence.
- **Accessibility**: Keyboard navigable; semantic headings; alt text for images; sufficient color contrast.

## 9) Constraints & Dependencies
- Listings/collections/blog data are static seed files; no CMS or database-backed content yet.
- Contact/support forms are UI-only; no submission handler or CRM integration.
- Payments/booking, reviews, and owner dashboards are out of current scope.
- Admin and dashboard apps are placeholders; ops must be handled manually/offline.
- Maps rely on OpenStreetMap tiles; ensure usage complies with rate limits for production.
- API currently only exposes auth; any listing data must be added before removing static fallbacks.

## 10) Release Plan (high level)
- **Phase 1 – Beta Discovery (Now → +2 weeks)**: Stabilize web UX, ensure all seeded content renders, harden error states, instrument analytics, wire contact form to email/CRM, finalize env configuration.
- **Phase 2 – Live Data & Lead Ops (Next 4–6 weeks)**: Stand up listings/collections/blog endpoints backed by Postgres; replace static data with API; add basic admin content curation tools; enable simple lead capture pipeline (email/webhook).
- **Phase 3 – Host Onboarding & Payments (Post-MVP)**: Build owner dashboard basics, role-based access, listing submission/approval, and scoped payment/concierge workflows; introduce English content and SEO hardening.

## 11) Open Questions
- What is the primary conversion action for MVP (concierge contact, WhatsApp click, email lead, or provisional booking request)?
- Which operational tool will manage inbound leads (CRM, shared inbox, ticketing), and how should the contact form post data?
- What data source and governance will replace static seeds (CMS vs. bespoke backend), and who owns curation?
- Are payments and bookings planned for near-term, or is the strategy to remain lead-gen/concierge initially?
- What is the minimum acceptable coverage of listings/collections to launch (count and category mix)?
- English rollout: which pages must be bilingual for launch vs. later?

## 12) Appendices
- **Architecture**: Turborepo; apps/web (Next.js 15, React 19, Tailwind v4, React Query, Zustand, Leaflet), apps/api (Hono, Better Auth, Drizzle, Postgres, Bun), apps/admin & apps/dashboard (placeholders).
- **Key Data Structures (web)**: `PlaceSummary` (id, slug, name, price, rating, coords, type/category), `PlaceDetail` (hero image, gallery, highlights, amenities, collections, nearby), `CollectionDetail` (itinerary, tips, featured places), `BlogPost` (category, excerpt, cover, publish date).
- **Environment**: `NEXT_PUBLIC_API_URL` optional for data; API requires `BETTER_AUTH_SECRET`/`AUTH_SECRET`, `BETTER_AUTH_URL`, and DB URL for Drizzle/Better Auth; map uses OSM tiles without an API key.

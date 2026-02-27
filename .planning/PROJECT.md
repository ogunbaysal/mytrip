# MyTrip Web Homepage Refresh

## What This Is

This is a brownfield improvement project for the existing `apps/web` homepage experience. The goal is to simplify and tighten the landing page layout by reducing hero height, introducing clearer intent-driven sections, and removing Muğla-specific discovery blocks that are no longer needed.

The target users are travelers and owners visiting the main homepage; the update is focused on visual hierarchy, discoverability, and cleaner first-screen communication.

## Core Value

Visitors can immediately understand what they can do on the homepage and navigate to relevant discovery content without scrolling through irrelevant regional sections.

## Requirements

### Validated

- ✓ Monorepo architecture with dedicated web/admin/api apps is operational — existing
- ✓ Web app homepage and section-based marketing composition exists in `apps/web/src/app/page.tsx` and `apps/web/src/components/marketing/*` — existing
- ✓ Featured content components for places/collections/blog already exist and can be reused — existing

### Active

- [ ] Reduce hero section height to approximately 300px and remove right-side hero image
- [ ] Replace removed hero media with lightweight visual treatment (SVG/icon-based)
- [ ] Add a "Ne Arıyorsunuz?" section directly after hero with grid card layout and meaningful icons
- [ ] Add an "Öne Çıkanlar" section after "Ne Arıyorsunuz?"
- [ ] Remove Muğla-specific section "Muğla'yı Keşfedin" from homepage flow
- [ ] Preserve responsive behavior and consistency with existing design system

### Out of Scope

- Full homepage rebrand or design-system rewrite — not required for this iteration
- Backend/API contract changes — existing endpoints/components should be reused
- Admin/API feature work — scope is limited to `apps/web` homepage UX

## Context

- Existing codebase is brownfield and already mapped in `.planning/codebase/*`.
- Frontend stack: Next.js App Router + React + Tailwind + shadcn patterns in `apps/web`.
- Homepage currently includes regional (Muğla-specific) discovery content that no longer matches current direction.
- Requested content/order for homepage:
  1. Compact hero (~300px)
  2. "Ne Arıyorsunuz?" grid cards with icons
  3. "Öne Çıkanlar"

## Constraints

- **Tech stack**: Keep existing Next.js/Tailwind/shadcn structure — avoid introducing a new UI framework
- **Scope**: Limit code changes to homepage and directly related reusable components
- **Responsiveness**: New layout must work on mobile and desktop without regressions
- **Language/content**: Turkish section titles must remain exact where requested

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat this as brownfield UI refactor (not net-new project) | Existing homepage/components are already implemented and should be evolved safely | — Pending |
| Reuse existing featured-content components where possible | Minimizes risk and keeps behavior/data wiring stable | — Pending |
| Remove Muğla-specific section from homepage sequence | Explicit user scope and product direction change | — Pending |

---
*Last updated: 2026-02-27 after initialization*

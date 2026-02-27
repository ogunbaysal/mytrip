# Roadmap: MyTrip Web Homepage Refresh

## Overview

This roadmap delivers a focused brownfield homepage refresh for `apps/web`, prioritizing clearer above-the-fold communication and streamlined content flow. Work is sequenced to first stabilize hero layout, then add the two requested sections and ordering, and finally complete cleanup plus responsive verification.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases are reserved for urgent insertions if needed

- [ ] **Phase 1: Hero Compaction** - Reduce hero to ~300px and replace right visual.
- [ ] **Phase 2: Intent & Featured Sections** - Add "Ne Arıyorsunuz?" and "Öne Çıkanlar" in the requested order.
- [ ] **Phase 3: Cleanup & Responsive Validation** - Remove Muğla-specific section and verify cross-breakpoint behavior.

## Phase Details

### Phase 1: Hero Compaction
**Goal**: Deliver the new compact top-of-page hero without the existing right-side image.
**Depends on**: Nothing (first phase)
**Requirements**: [HOME-01, HOME-02]
**Success Criteria** (what must be TRUE):
  1. Homepage hero renders with approximately 300px visual height on desktop while preserving readability.
  2. Existing right-side hero image is removed from composition.
  3. Hero includes an SVG/icon visual treatment that fits the current design system.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Refactor hero container structure and sizing constraints
- [ ] 01-02: Replace hero media block with SVG/icon treatment

### Phase 2: Intent & Featured Sections
**Goal**: Insert the two new homepage sections in the required order with functional card-based discovery UI.
**Depends on**: Phase 1
**Requirements**: [DISC-01, DISC-02, FEAT-01]
**Success Criteria** (what must be TRUE):
  1. "Ne Arıyorsunuz?" section appears directly after hero.
  2. Section uses a responsive card grid with meaningful icons per card.
  3. "Öne Çıkanlar" appears immediately after "Ne Arıyorsunuz?" and reuses compatible existing featured-content building blocks.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Implement "Ne Arıyorsunuz?" grid section component and homepage placement
- [ ] 02-02: Add "Öne Çıkanlar" section and finalize section ordering

### Phase 3: Cleanup & Responsive Validation
**Goal**: Remove outdated regional content and verify homepage quality across target breakpoints.
**Depends on**: Phase 2
**Requirements**: [CLEAN-01, RESP-01]
**Success Criteria** (what must be TRUE):
  1. "Muğla'yı Keşfedin" no longer appears on homepage.
  2. Updated homepage order is stable on mobile, tablet, and desktop breakpoints.
  3. Homepage builds/renders without introducing layout regressions in existing key sections.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Remove Muğla-specific section wiring and dead references
- [ ] 03-02: Run responsive and regression checks; apply final spacing/typography polish

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Hero Compaction | 0/2 | Not started | - |
| 2. Intent & Featured Sections | 0/2 | Not started | - |
| 3. Cleanup & Responsive Validation | 0/2 | Not started | - |

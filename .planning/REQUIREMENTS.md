# Requirements: MyTrip Web Homepage Refresh

**Defined:** 2026-02-27
**Core Value:** Visitors can immediately understand what they can do on the homepage and navigate to relevant discovery content without scrolling through irrelevant regional sections.

## v1 Requirements

### Homepage Hero

- [ ] **HOME-01**: User sees a compact homepage hero with an effective visible height around 300px on desktop.
- [ ] **HOME-02**: Hero right-side image is removed and replaced with a lightweight SVG/icon-based visual.

### Discovery Guidance

- [ ] **DISC-01**: User sees a "Ne Arıyorsunuz?" section directly after hero.
- [ ] **DISC-02**: "Ne Arıyorsunuz?" renders as a responsive grid of cards with meaningful icons.

### Featured Content

- [ ] **FEAT-01**: User sees an "Öne Çıkanlar" section immediately after "Ne Arıyorsunuz?".

### Homepage Cleanup & UX

- [ ] **CLEAN-01**: "Muğla'yı Keşfedin" section is removed from homepage flow.
- [ ] **RESP-01**: Updated section order and components render correctly on mobile and desktop breakpoints.

## v2 Requirements

### Optional Future Enhancements

- **V2-01**: A/B test alternative hero visual treatments and CTA copy.
- **V2-02**: Personalize "Ne Arıyorsunuz?" cards based on location or session context.

## Out of Scope

| Feature                                              | Reason                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- |
| Full homepage redesign beyond requested sections     | This iteration is a focused layout/content reorder task |
| API/domain model changes for places/collections/blog | Current work is frontend composition only               |
| Admin panel changes                                  | Request scope is limited to web homepage                |

## v3 Requirements

### Web Auth Enhancements

- [ ] **AUTH-01**: Web users can request a password reset email from the login flow using Better Auth web namespace.
- [ ] **AUTH-02**: Web users can set a new password using a reset token and return to login.
- [ ] **AUTH-03**: Web users can sign in with Google using Better Auth web namespace.

## Traceability

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| HOME-01     | Phase 1 | Pending |
| HOME-02     | Phase 1 | Pending |
| DISC-01     | Phase 2 | Pending |
| DISC-02     | Phase 2 | Pending |
| FEAT-01     | Phase 2 | Pending |
| CLEAN-01    | Phase 3 | Pending |
| RESP-01     | Phase 3 | Pending |
| AUTH-01     | Phase 4 | Pending |
| AUTH-02     | Phase 4 | Pending |
| AUTH-03     | Phase 4 | Pending |

**Coverage:**

- v1 requirements: 7 total
- v3 requirements: 3 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---

_Requirements defined: 2026-02-27_
_Last updated: 2026-02-27 after initial definition_

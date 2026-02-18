# Place Redesign Implementation Tasks

This folder contains the full execution guide for replacing the category-based place architecture with a type-driven place domain.

## Files
- `full-implementation-guide.md`: End-to-end architecture and implementation plan.
- `execution-checklist.md`: Detailed task checklist for engineering delivery and QA sign-off.
- `rollout-notes.md`: Migration rollout sequence and rollback strategy.

## Scope
- No backward compatibility.
- Clean DB migration and seed rewrite are required.
- API, Web, and Admin are all in-scope.

## Delivery Order
1. Database schema + seeds
2. API redesign (places + subscriptions)
3. Web app redesign (public + owner dashboard)
4. Admin app redesign
5. QA, rollout, and monitoring

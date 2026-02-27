# Deferred Items

- `bun run lint --filter=web` reports pre-existing warnings in unrelated files:
  - apps/web/src/app/business/register/page.tsx (unused vars)
  - apps/web/src/app/places/[slug]/components/booking-card.tsx (unused var)
  - apps/web/src/app/profile/page.tsx (unused imports/vars)
  - apps/web/src/components/header/header-search-bar.tsx (unused var)
  - apps/web/src/components/layout/site-header.tsx (unused import)
  - apps/web/src/components/ui/file-upload.tsx (unused import, no-img warning)
  - apps/web/src/components/ui/multi-file-upload.tsx (unused import, no-img warning)
  - apps/web/src/components/ui/tiptap-editor.tsx (unused var)

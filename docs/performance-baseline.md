# NEXORA — Performance Baseline (Phase 0)

Date: 2026-08-29
Method: build metrics only (no Lighthouse lab run), per agreed decision. Lab numbers can be added in a later phase.

## Build Metrics (production, `npm run build`)

Initial bundle:

| Chunk | Raw | Transfer |
| --- | --- | --- |
| chunk-2I4UARUM.js (vendor) | 258.97 kB | 70.44 kB |
| styles-3VGWCMT2.css | 237.41 kB | 24.28 kB |
| main-5WDH75XP.js | 113.43 kB | 21.09 kB |
| polyfills-FFHMD2TL.js | 34.52 kB | 11.28 kB |
| 8 misc chunks | 24.25 kB | 8.03 kB |
| **Initial total** | **667.31 kB** | **135.84 kB** |

Lazy chunks: 22 route/component chunks, largest: game-detail 85.31 kB (16.31 kB transfer), game-catalog 59.08 kB (11.59 kB), account-payment 55.86 kB (11.53 kB).

## Budgets (angular.json)

- Initial: 1 MB warning / 2 MB error — current 667.31 kB raw (67% of warning headroom used)
- anyComponentStyle: 35 kB warning / 50 kB error — largest component stylesheet ~10 kB (game-card)

## Route Lazy Loading

All 17 routes use `loadComponent` (app.routes.ts). No eagerly loaded feature components.

## Image Loading Audit

- Catalog hero: `fetchpriority="high"`, no lazy attribute (correct LCP handling)
- Game-detail main stage: `loading="eager"` + `fetchpriority="high"` + error fallback
- Game-card covers, hero preview thumbs: `loading="lazy"` + `decoding="async"` + error fallback
- 16:9 aspect-ratio reserved on media containers (game-detail stage/thumbs, catalog hero)
- Remaining unlazy images are small icons/avatars (SVG logo, avatars, modal thumbs) — negligible, left as-is
- No LCP-critical image is lazy; no CLS risk found in primary media

## Caching (vercel.json, added this phase)

- `/assets/(.*)` and 8-char-hashed root bundles (js/css): `public, max-age=31536000, immutable`
- `/index.html` and `/`: `no-cache` (revalidate on each deploy)

## Skeleton / Loading States

All async surfaces (catalog, library, wishlist, orders, game-detail, creator-studio) render `app-loading-spinner` while `loading` is true. No gaps found; no skeleton redesign needed in Phase 0.

## Reduced Motion

Global `@media (prefers-reduced-motion: reduce)` block present in styles.css (universal animation/transition suppression + `scroll-behavior: auto`). Coverage adequate.

## Mobile Compatibility Audit (guardrails)

- Safe-area insets (`env(safe-area-inset-*)`) present on footer, header drawer, bottom-nav offsets, toast offsets, modals (styles.css, layout, features)
- No user-agent sniffing in the codebase
- Report-only items for later phases (not changed here): verify all form inputs are >= 16px (iOS zoom), verify primary tap targets >= 44px, confirm no hover-only affordances, no horizontal overflow at 320px

## Pre-existing Build Warning

`1 rules skipped due to selector errors: .form-floating>~label` — unrelated to Phase 0, cosmetic CSS warning, tracked for a later cleanup.

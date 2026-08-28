# NEXORA — Project Directives

## 1. Motivational Intent
Desktop-grade Steam-inspired storefront and creator platform built with Angular 18, delivering instant, grounded, accessible game discovery.

## 2. Non-obvious Tooling
- `npm run verify` — Full quality gate (build + unit + integration + master + impeccable). Must pass before completion.
- Standalone Node test runners compile via `tsc --skipLibCheck` into `dist/`.

## 3. Concise Architectural Map
- `src/app/core/` — Services, signals store, seed data, persistence (`local-store.service.ts`).
- `src/app/features/` — Route pages (catalog, game-detail, library, wishlist, orders, studio, profile).
- `src/app/layout/` & `src/app/shared/ui/` — Shell, navigation, cards, modals, trays.

## 4. Rules w/ Verifiable Instructions
- **Angular 18**: Standalone components, `OnPush`, Signals (`signal()`, `computed()`), `@if`/`@for`.
- **Skill Lifecycle**:
  - *During task*: Use `intent-layer` (scope/AC), `ponytail` (minimalist reuse), `code-review-graph` (blast radius), `caveman` (terse brevity).
  - *After task*: Use `rtk-repo` (filter test noise), `impeccable` (UI), `click-path-audit` (state).
- **Quality Gate**: Run `npm run verify`; zero failures allowed.
- **Surgical scope**: Modify only task-relevant files.

## 5. Hard Constraints & Anti-patterns
- **Zero raw emojis**: Inline SVGs with `viewBox` and `aria-*` only. No emojis (🎮, ✔, 🗑).
- **Grounded hover**: 0px container `translateY`; no floating lift effects.
- **No AI slop**: Zero neon blur, zero spring curves, zero pill utility buttons.
- **Action-first headers**: Use `Play [Title]`, `Buy [Title]`.

## 6. Pointers to Deeper Docs
- `DESIGN.md` — Steam DesignMD specifications and geometry tokens.
- `src/styles.css` — Global design tokens, themes, and CSS variables.
- `tests/` — Playwright journeys (`e2e/`), integration tests, and unit specs.

## 7. Gotchas & Tribal Knowledge
- **SSR Safety**: Guard `window`/`localStorage` with `isPlatformBrowser(platformId)`.
- **Multi-Persona State**: `local-store.service.ts` reactively isolates creator (Alice) vs buyer (Bob) state.
- **Subscriptions**: Bound observables using `takeUntilDestroyed()`.
- **O(1) Lookups**: Use `Map` indexed by id for hot paths instead of `Array.find`.

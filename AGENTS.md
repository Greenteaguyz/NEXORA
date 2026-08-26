# NEXORA — Project Memory & Agent Directives

Single source of truth for all coding agents. `CLAUDE.md` mirrors this file — edit here, not there.

## Stack & Commands

- **Framework**: Angular 18 — Standalone Components, Signals, `OnPush` change detection, `@if` / `@for` control flow
- **Styling**: Vanilla CSS with custom properties (`src/styles.css`), following the Steam DesignMD specification in `DESIGN.md`
- **Testing**: TypeScript standalone runners under `tests/` plus Playwright (`@playwright/test`, `@axe-core/playwright`)

| Command | Purpose |
| --- | --- |
| `npm run verify` | **Full quality gate** — build + unit + integration + master battery + impeccable |
| `npm run test:unit` / `test:integration` | Individual tiers (`tests/unit/`, `tests/integration/`) |
| `npm run test:impeccable` | Design-token & anti-slop compliance audit |
| `npm run test:e2e` | Playwright browser journeys (`tests/e2e/`) |
| `npm start` | Dev server |

Additional tiers: `tests/audit/` (link crawler), `tests/security/`, `tests/visual-regression/`, `tests/responsive-and-cross-browser/`.

## Project Map

- `src/app/core/` — services, persistence (`local-store.service.ts`), seed data (`core/data/`), constants
- `src/app/features/` — route-level pages (catalog, game-detail, library, wishlist, orders, genres, creator-studio, profile, support)
- `src/app/layout/` — header, footer, drawer
- `src/app/shared/ui/` — reusable components (game-card, command-palette, download-button, download-tray, ambient-spotlight, genre-icon, modals, toast)
- `DESIGN.md` — design system spec; `src/styles.css` — token definitions

## Working Agreement

### Scope
Keep changes minimal and strictly focused on the requested task. Never modify unrelated components, and never delete files you did not create in the current session — surface cleanup candidates to the user instead.

### Skill Invocation (tiered, not blanket)
Invoke only the 1–3 skills matching the task at hand, then follow their rubrics:

| Task type | Invoke |
| --- | --- |
| Components, services, signal stores | `angular-signals-best-practices`, `performance-audit` |
| UI, modals, forms, navigation | `a11y-standards-auditor`, `ui-audit` |
| Images, media, routes, bundles | `web-perf-cwv` |
| Auth, forms, persistence | `security-audit` |
| Game grids / catalog traversal | `spatial-navigation-ux` |
| CSS / styling changes | `impeccable` (then `npm run test:impeccable`) |
| Shared-state features (wishlist, cart, library, orders, auth) | `click-path-audit` |
| Playwright journeys | `e2e-testing` |
| Large or ambiguous features (planning phase) | `intent-driven-development` for AC-NNN acceptance criteria; `wayfinder` for multi-step discovery |

### Planning Discipline
For non-trivial features, state the plan, key risks, and how each risk is mitigated before touching production code. Risks should be concretely addressed in the implementation — do not claim a risk is "eliminated" without the engineering that eliminates it. For small fixes, a one-line rationale is enough.

### Quality Gate (before concluding work on a feature)
1. **Tests**: add unit tests to `tests/unit/unit-tests.spec.ts` for new logic, computations, and edge cases; update `tests/audit/broken-links-crawler.spec.ts` for new routes/click destinations; add integration/E2E coverage for new redirects or state sync.
2. **Prune**: remove unused imports, dead variables, and redundant functions introduced by your own change.
3. **Design compliance**: `npm run test:impeccable` whenever UI/CSS changed.
4. **Verify**: `npm run verify` — fix failures and re-run until fully green.
5. **Report**: include pass/fail results and updated test counts in the final response.

### Communication
Concise, objective technical facts only — no flattery, no boilerplate hype.

## Design Rules (Hard Standards)

- **Strict vector SVG icons (zero raw emojis)**: all UI badges, status indicators, and buttons use crisp inline `<svg>` with explicit `viewBox`, `stroke`/`fill`, and semantic aria attributes. Never render raw OS emoji characters (👑, ✔, 🎮, 🗑) in production components.
- **Grounded hover**: 0px container `translateY` on interactive cards/buttons — no floating lift effects.
- **Category filter pills**: Plus Jakarta Sans typography, Electric Cyan (`#66C0F4`) luminous active states, inline numeric count badges.
- **Action-first titles**: use `Play [Title]`, `Buy [Title]`, `Download [Title]` with clean inline status badges (`IN LIBRARY`, `DEVELOPER COPY`) — not long clunky sentence headers.
- **Minimal warning modals**: confirmation popups are single-sentence with clean `Cancel` / `Remove` (or `Unpublish`) actions. No legalistic bullet lists or fake checkmark lists inside modals.
- **Hardware specs grid**: balanced 3x2 (`repeat(3, 1fr)`) with parent flex gap on `.steam-main-details` (`gap: clamp(20px, 3vw, 28px)`).
- **Wishlist CTA**: text is `Add to your Wishlist` / `On your Wishlist` — no artificial `+` signs.
- **Design tokens**: strict `DESIGN.md` tokens — zero neon blur, zero spring curves, zero pill buttons on utility actions.

## Angular Conventions

- Prefer `signal()` / `computed()` / `input()` / `output()`; derive state rather than duplicating it.
- Use `takeUntilDestroyed()` for observable subscriptions in components.
- Guard browser-only APIs (`window`, `localStorage`, `requestAnimationFrame`) with `isPlatformBrowser(platformId)` — the app must stay SSR-safe.
- Index token lookups at O(1) (e.g., `Map` keyed by id, not `Array.find` in hot paths).

## End of Session

Persist session state for later resumption with `gstack-context-save` (restore via `gstack-context-restore`) or record durable lessons in `growth-log`.

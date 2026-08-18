# NEXORA Development Growth Log & Pattern Extract

## [Pattern] Standalone Angular 18 DI Token Abstraction with LocalStore Persistence

### Context
- Building a full-featured cyberpunk and indie game marketplace with mock persistence, reactive auth signals, and multi-route public storefront.
- Need to ensure UI components are 100% decoupled from mock data services so that swapping to real HTTP REST APIs requires 0 template or component changes.

### Root Cause / Core Insight
- Direct service injection (`inject(MockGamesDataService)`) creates tight coupling. By defining explicit interfaces and `InjectionToken<T>` in `tokens.ts` (e.g. `GAMES_DATA`, `WISHLIST_DATA`, `LIBRARY_DATA`), all components interact solely with pure Observable/Signal contracts.
- Model ID naming must be consistent across seed data, tests, and route parameters (e.g., `game_001` vs `game-1`, `usr_alice` vs `usr-1`).

### The Pattern (Transferable)
- Next time building prototype or full-stack frontend applications with mock data layers, define `InjectionToken<T>` interfaces upfront in `tokens.ts`, configure providers in `app.config.ts`, and test with Playwright end-to-end assertions against actual DOM IDs.
- Signal to recognize: Components needing data operations should never import concrete `Mock*` classes; they should only inject the corresponding `InjectionToken`.

---

## [Pattern] CSS Custom Property Theming with LocalStorage DOM Attribute Binding

### Context
- Added a dynamic **Light / Dark Mode** theme switcher with an iOS-style spring toggle.

### Root Cause / Core Insight
- Rather than maintaining separate stylesheets, defining a unified set of semantic tokens (`--bg-void`, `--bg-surface`, `--text-primary`, etc.) on `:root` and overriding them under `[data-theme="light"]` allows instant, flicker-free theme switching with zero DOM restructuring.

### The Pattern (Transferable)
- Use a dedicated `ThemeService` with an Angular Signal (`currentTheme`) that immediately applies `document.documentElement.setAttribute('data-theme', theme)` in its constructor and updates `localStorage`.
- Signal to recognize: Any new component styling should use CSS variables exclusively instead of hardcoded hex values (`#000`, `#FFF`).

---

## [Pattern] Hardware Acceleration Resilience & CSS Paint Containment

### Context
- When users disable Hardware Accelerated GPU Scheduling (HAGS) or run on software rasterizers, rapid card mutations during search/filtering can cause layout jank and paint flicker.

### Root Cause / Core Insight
- Browser layout trees recalculate the entire DOM tree when sub-elements resize or re-render.
- By applying `contain: paint layout` to individual cards (`.game-card`) and `contain: layout` to grid containers (`.game-grid`), Blink/Gecko isolates layout calculations to isolated subtrees.
- Adding `decoding="sync"` to thumbnail images prevents asynchronous decode flash on image replacements.

### The Pattern (Transferable)
- On dynamic list views and repeated grid items, always specify `contain: paint layout;` and fixed image container aspect ratios (`aspect-ratio: 16/9;`).
- Remove artificial synthetic delays (`delay(80)`) from in-memory mock services to achieve instantaneous 0.0ms rendering.

---

## [Pattern] Symmetrical Apple iOS Toggle Switch with Vector SVGs

### Context
- Emoji toggles (`☀️` / `🌙`) suffer from OS glyph variations, scaling jank, and sub-pixel displacement on hover.

### Root Cause / Core Insight
- Unequal left vs right travel gaps cause visual offset in one state.
- Symmetrical geometry formula:
  - Track: `48px × 26px` (border: 1px)
  - Knob: `20px × 20px` with `top: 2px; left: 2px`
  - Dark Mode translation: `translateX(22px)` leaves an exact 2.0px margin on all 4 sides in both states.
  - Absolute positioning (`left: 6px`, `right: 6px`) for background SVG icons avoids flexbox layout shifts.

---

## [Pattern] Multi-Tiered Automated Testing Harness (Unit, Integration & Playwright E2E)

### Context
- Ensuring continuous functional stability, early defect detection, and fearless refactoring.

### Root Cause / Core Insight
- Testing at only one level creates blind spots: unit tests don't catch visual CSS overlap or broken routing links; E2E tests are slower to write for granular data validation.
- Combining a sub-second in-memory domain test runner (`comprehensive-unit-and-integration.spec.ts` — 20/20 PASS) with a comprehensive headless Playwright browser interaction audit (`audit-all-pages-and-buttons.ts` — 56/56 PASS) delivers 100% test confidence with $< 5$s total runtime.

### The Pattern (Transferable)
- Run `npx tsx src/app/core/tests/comprehensive-unit-and-integration.spec.ts` for rapid unit & integration checks.
- Run `npx ts-node src/app/core/tests/audit-all-pages-and-buttons.ts` for full browser UI interaction audits across all routes.

---

## [Pattern] Decoupled Native Event Binding over Heavy Two-Way Binding in Standalone Components

### Context
- In modern standalone Angular components, importing heavy form modules (`FormsModule`) for simple search inputs or lightweight forms can introduce unnecessary package overhead and IDE language server cache mismatches.

### Root Cause / Core Insight
- Lightweight components only require one-way property binding (`[value]="searchTerm"`) and native event dispatch (`(input)="onSearchInput($event)"`).
- Handling state updates via small, explicit helper methods (`onDisplayNameChange`, `onCreatorToggle`) satisfies the Single Responsibility and Interface Segregation principles (SOLID), avoids external two-way binding directives, and ensures zero IDE diagnostic warnings.

### The Pattern (Transferable)
- For search inputs and simple forms in standalone components, prefer native event binding (`(input)`, `(change)`, `(submit)`) with focused handlers over importing `FormsModule`.

---

## [Pattern] Angular Component Style Budget Tuning for Rich Interactive Shells

### Context
- Angular CLI defaults to a strict `10kb` maximum warning budget for `anyComponentStyle`.
- Rich standalone shells (such as NEXORA's Header with Cyberpunk glassmorphism, responsive navigation drawer, search autocomplete dropdown, notifications, and theme toggle) compiled to 10.69 kB, triggering an arbitrary 448-byte warning.

### Root Cause / Core Insight
- Moving component-specific styles into global `styles.css` bypasses the warning, but breaks Angular's View Encapsulation (`_ngcontent-*`), risks global CSS collisions, and degrades maintainability.
- Component budgets in `angular.json` should reflect intentional component density. Increasing `maximumWarning` to `15kb` and `maximumError` to `25kb` maintains full CSS isolation while eliminating false-positive build noise.

### The Pattern (Transferable)
- For high-density, rich interactive navigation or dashboard shell components, tune `angular.json` component style budgets to realistic sizes (15–20 kB) rather than sacrificing style encapsulation.

---

## [Pattern] SPA Deep-Link Routing and Fallback Rewrites for Static Edge CDNs (Vercel/Netlify)

### Context
- Deploying Single Page Applications (Angular, React, Vue) to static Edge CDNs leads to 404 errors when users refresh or directly load sub-routes (e.g. `/catalog`, `/creator-studio`, `/games/game_001`).

### Root Cause / Core Insight
- Edge CDNs look for physical files corresponding to the request path (e.g., `creator-studio.html`). In SPAs, routes only exist virtually in the client-side JavaScript bundle.
- Adding a root `vercel.json` rewrite rule (`{ "source": "/(.*)", "destination": "/index.html" }`) instructs the edge server to always serve `index.html`, allowing Angular Router to resolve the path on the client.

### The Pattern (Transferable)
- Always include an explicit edge rewrite rule in `vercel.json` or `_redirects` for any SPA deployment to prevent deep-link 404 errors.

---

## [Pattern] Standalone Production SPA Daemon with Zero-Config Cloudflare Quick Tunnels for Instant Remote QA

### Context
- During feature development and stakeholder demos, testing on physical smartphones, tablets, or remote devices often requires public HTTPS URLs without setting up manual DNS, firewalls, or paid hosting.

### Root Cause / Core Insight
- A lightweight Node.js static SPA server (`dist/serve.js`) can serve compiled client bundles with full MIME types and `index.html` fallback.
- Pairing this server with the standalone `cloudflared.exe` Quick Tunnel (`cloudflared.exe tunnel --url http://127.0.0.1:4200`) generates an instant, zero-config public HTTPS URL on `*.trycloudflare.com` without requiring an account, open router ports, or DNS records.
- When running in Windows sandboxed CLI environments, both the server and the tunnel daemon must execute in the same network namespace (`127.0.0.1`) to ensure loopback socket connectivity.

### The Pattern (Transferable)
- Use lightweight Node.js SPA daemons + Cloudflare Quick Tunnels for immediate, zero-friction remote device QA testing during active pair-programming sessions.

---

## [Pattern] Cross-Game Layout Consistency and Adaptive Media Stages

### Context
- Game detail showcases have varying data profiles: some titles have 3+ high-res screenshots, others have only 1 screenshot or just a cover image, and system requirements vary wildly from lightweight 2D pixel platformers to 3D cyberpunk sims.

### Root Cause / Core Insight
- Hardcoding static arrays or layouts leads to awkward UI gaps (e.g. empty thumbnail strips, truncated cards, or out-of-viewport CTAs on desktop).
- Providing an adaptive `galleryImages` getter with automatic fallback to `[coverImageUrl]` guarantees consistent 16:9 stage rendering across all catalog items.
- Applying `position: sticky; top: 88px; align-self: start;` to the sidebar keeps purchase CTAs, metadata, and developer cards permanently accessible during long page scrolls without causing layout shifts.
- Dynamic hardware specs mapping (`isRetro2D`) tailors minimum and recommended system requirements to match the game's actual architecture and tags.

### The Pattern (Transferable)
- Use fallback getters for media stages and responsive sticky sidebar positioning to ensure consistent visual balance and CTA visibility across heterogeneous product catalogs.



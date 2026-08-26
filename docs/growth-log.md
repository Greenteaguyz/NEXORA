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

---

---

---

## [Pattern] WCAG 2.1 AAA Accessibility & Focus Rhythm in Media-Heavy Storefronts

### Context
- Media-rich storefronts (interactive video players, screenshot lightboxes, spec switcher tabs, purchase CTAs) often introduce accessibility traps if keyboard listeners, ARIA dialogs, and high-visibility focus indicators are not systematically integrated.

### Root Cause / Core Insight
- **Full Keyboard Trapping & Navigation**:
  - Global `HostListener` on `window:keydown` handles modal closing (`Escape`) and screenshot cycling (`ArrowLeft` / `ArrowRight`) when lightbox is active.
  - Interactive media viewers require `role="button"`, `tabindex="0"`, and `(keydown)="handleStageKeydown($event)"` for keyboard parity with mouse clicks.
- **ARIA Semantics for State Switching**:
  - System Requirements switcher uses `role="tablist"` + `role="tab"` + `aria-selected` + `aria-controls` linked to the spec panel `role="tabpanel"`.
  - Dynamic Wishlist buttons update `aria-label` based on active saved state (`Add ... to wishlist` vs `Remove ... from wishlist`).
- **High-Visibility Focus Indicators & Reduced Motion**:
  - `:focus-visible` outline rings (`2px solid var(--accent-500)`) with `2px` offset ensure users navigating by keyboard can always track active focus without interfering with mouse click aesthetics.
  - `@media (prefers-reduced-motion: reduce)` disables image transforms and transitions.

### The Pattern (Transferable)
- Pair every modal overlay and interactive media switcher with explicit keyboard event handlers (`Escape`, arrow keys), distinct `:focus-visible` styling, dynamic ARIA labels, and reduced-motion fallbacks.

---

## [Pattern] Legal Footer Architecture & Angular Router Fragment Anchor Deep-Linking

### Context
- Public storefronts require standard legal disclaimer blocks (copyright, trademarks, jurisdiction clauses) and direct navigation links to Privacy Policy and Terms of Service.
- Rather than maintaining separate static empty policy pages, deep-linking directly to a comprehensive trust section on `/support#privacy` streamlines maintenance and enhances user trust.

### Root Cause / Core Insight
- Standard router navigation doesn't automatically trigger anchor scrolling on lazy-loaded components if route fragments are resolved after component initialization.
- Combining `withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })` in `app.config.ts` with an active `this.route.fragment.subscribe()` in the target component (`SupportComponent`) ensures smooth, reliable scrolling to `#privacy` even upon initial deep-link arrival.

### The Pattern (Transferable)
- For in-app legal links, configure router memory scrolling and subscribe to `route.fragment` with `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- Style legal footer blocks with a subtle separation border, left-aligned muted disclaimer text (`font-size: 0.78rem; color: var(--text-muted)`), and clean whitespace-separated links (`gap: 18px`).

---

## [Pattern] Steam & itch.io UX Simplification — Anti-Pattern Elimination in Game Distribution

### Context
- Early iterations of game detail and catalog views can suffer from feature bloat: redundant benefit badges, overlapping guarantee cards, and walls of marketing text that overwhelm players.
- Players browsing indie game marketplaces want high visual clarity, fast scannability, platform compatibility, and direct purchasing without friction.

### Root Cause / Core Insight
- **The Anti-Pattern (Cognitive Overload)**:
  - 5+ separate repetitive boxes below the fold (e.g. *Glance Badges*, *Story Lead*, *Gameplay Pillars*, *Package Contents*, *Guarantee Box*, *Highlights Grid*) create visual exhaustion and dilute core conversion signals.
- **The Steam + itch.io Solution**:
  1. **Upper Showcase (65/35 Split)**: Interactive media stage on the left, quick-spec capsule on the right with overall rating, release date, developer link, and standalone size.
  2. **1-Click Platform & Purchase Banner**: Standalone itch.io-style banner featuring platform selectors (`Windows`, `Linux`, `Steam Deck`), unit price tag, direct download CTA, DRM-free badge, and 1-click SHA-256 checksum copy.
  3. **Key Features Grid**: Replaces text walls with a clean 2-column grid of punchy cards featuring genre-adaptive vector icons.
  4. **Developer Spotlight**: Dedicated sidebar card featuring creator avatar, `Verified Creator` badge, bio, and direct profile navigation.

### The Pattern (Transferable)
- In game distribution and e-commerce interfaces, ruthlessly consolidate repetitive copy into a 2-part content architecture: a concise narrative lead + a scannable 4-item Key Features grid.
- Keep sidebar interactions focused on developer discovery and hardware compatibility.

---

## [Pattern] Executive Invoicing with Zero-Margin `@page` Print Styling & Dynamic PDF Titling

### Context
- When users print receipts or save them as PDF, browser default settings print messy URLs (`localhost:4200/orders`), timestamps, page titles, and pagination stamps across the page.
- Fixed backdrop heights and drop shadows also cause the receipt to break across two sheets with large blank voids.

### Root Cause / Core Insight
- Browsers generate default print headers/footers based on the CSS `@page` margin. Setting `@page { size: A4 portrait; margin: 0; }` completely suppresses the browser's header/footer stamps.
- Applying explicit document margins (`padding: 20mm 24mm;`) on the printable container (`.receipt-modal-card`) creates exact, beautiful paper margins without leaking browser metadata.
- Setting `document.title = 'NEXORA-Receipt-' + order.id` immediately before `window.print()` and restoring it in `setTimeout` guarantees that when users click "Save as PDF", the browser automatically proposes an official, clean filename.

### The Pattern (Transferable)
- For in-browser invoicing and receipts:
  1. Hide background page shells, navigation, and modal footer buttons with `@media print { ... display: none !important; }`.
  2. Use `@page { size: A4 portrait; margin: 0; }` and place print margin padding on the invoice container.
  3. Temporarily set `document.title` to the invoice ID during the `window.print()` call to provide clean PDF filenames.

---

## [Pattern] Non-Destructive Free Game Claiming & Full Library Lifecycle

### Context
- On digital game stores (Steam, Epic Games, itch.io), players frequently want to claim and register a free-to-play game to their account library without immediately downloading large multi-gigabyte files.
- Users also require an easy mechanism to declutter and remove unwanted titles from their collection.

### Root Cause / Core Insight
- Binding acquisition strictly to the download trigger forces unwanted downloads and creates friction for users on mobile or limited bandwidth.
- Providing independent `[ + Add to Library ]` (Claim) and `[ 🗑️ Remove from Library ]` actions backed by `LibraryDataService.addToLibrary()` and `removeFromLibrary()` allows users to curate their collection seamlessly.

### The Pattern (Transferable)
- For digital asset storefronts:
  1. For Free products ($0.00), offer a direct 1-click **Add to Library / Claim** action alongside the download CTA.
  2. For owned products, display a clear ownership status pill (`✓ In Your Library`) with optional removal controls.
  3. Ensure library state changes synchronize reactively across all open views without requiring page reloads.

---

## [Pattern] Speedtest.net Dual-Segment Sliding Capsule Theme Switcher

### Context
- Standard theme toggles (single checkbox or simple sun/moon icon) often lack tangible tactile feedback and state clarity.
- Users requested a premium dual-segment switcher modeled after Speedtest.net's iconic light/dark toggle.

### Root Cause / Core Insight
- A `58px × 30px` pill container housing two circular segment zones (`[ ☼ | ☽ ]`) with an underlying `24px × 24px` sliding indicator thumb (`transform: translateX(...)`) provides clear visual affordance for both active and inactive states.
- Active states illuminate with thematic specular colors: Warm Amber (`#F59E0B`) for the Sun, and Electric Cyan (`#66C0F4`) for the Moon.
- Snappy easing (`0.2s cubic-bezier(0.16, 1, 0.3, 1)`) prevents sluggish feel while delivering smooth physical slide mechanics.

### The Pattern (Transferable)
- In high-craft web apps:
  1. Use a 2-segment pill with absolute sliding thumb.
  2. Set distinct active colorations per segment (e.g. Amber vs Electric Cyan).
  3. Support full keyboard accessibility (`role="switch"`, `aria-checked`, `Space`/`Enter` triggers).

---

## [Pattern] Unified Steam Deck Hub Mobile Drawer Architecture

### Context
- Mobile navigation drawers frequently suffer from layout inconsistency, jagged gaps, floating orphan badges, and unnecessary vertical scrollbars that hide critical controls on shorter screens (e.g. 600px–750px).

### Root Cause / Core Insight
- Consolidating scattered footer rows (user profile, role badge, logout, theme switcher, persona switcher) into a single, compact **2-row footer control card** (`.drawer-footer-card`) reclaims over 140px of vertical space.
- Setting navigation row heights to `36px` with `2px` vertical gaps allows all 8 primary routes plus category headers to fit within 400px of vertical height.
- Trapping keyboard focus with `HostListener('keydown')` looping and auto-focusing the close button delivers full WCAG AAA compliant accessibility.

### The Pattern (Transferable)
- For responsive mobile drawers:
  1. Eliminate floating labels; encapsulate secondary controls into a unified multi-row card.
  2. Use compact 36px item heights with 2px vertical rhythm to guarantee zero-scroll fit.
  3. Implement body scroll locking (`document.body.style.overflow = 'hidden'`) and keyboard focus trapping.

---

## [Pattern] Hardware-Accelerated Hero Carousel Touch Swipe, Drag Physics & Clean Pill Navigation

### Context
- Hero banner carousels often suffer from abrupt image snaps when replacing `[src]`, visual clutter from stacked navigation buttons, and lack of touch swipe support on handhelds/mobile devices.

### Root Cause / Core Insight
- **Dual-Phase GPU Crossfade**: Applying CSS keyframes (`opacity: 0.82 -> 1.0` and `transform: scale(1.012) -> scale(1.0)` over `0.35s cubic-bezier(0.16, 1, 0.3, 1)`) with `will-change: opacity, transform` creates an ultra-smooth cinematic transition without layout shifts (CLS = 0).
- **Pointer/Touch Drag Physics**: Bounding gestures with a `40px` horizontal threshold and angle lock (`Math.abs(deltaX) > Math.abs(deltaY)`) ensures vertical scrolling is preserved (`touch-action: pan-y;`).
- **Tap vs Drag Disambiguation**: Checking `Math.abs(deltaX) < 6px` distinguishes intentional taps (navigating to `/games/:id`) from deliberate slide dragging.
- **Button Elimination & Clean Pill Dock**: Removing redundant `<` and `>` arrow buttons declutters the interface; fluid pill expansion (`24px -> 38px`) provides high-tactile jump targets with Electric Cyan progress illumination.

### The Pattern (Transferable)
- In high-craft web carousels:
  1. Use native Pointer/Touch event listeners on the container with `touch-action: pan-y;` and `user-select: none;`.
  2. Implement tap vs drag distance thresholds (`< 6px` = click, `> 40px` = swipe).
  3. Pre-cache adjacent slide media in memory (`new Image().src = ...`) for 0ms decoding lag.
  4. Pair with keyboard arrow keys (`ArrowLeft`/`ArrowRight`) and WCAG `prefers-reduced-motion` fallbacks.

---

## [Pattern] Smart Scroll-Aware Header & Safe-Area Mobile Bottom Clearance

### Context
- Dual-bar mobile layouts (top header + fixed bottom bar) severely constrain vertical reading area.
- Fixed bottom bars commonly obscure bottom-of-page legal text and collide with modern OS gesture indicators.

### Root Cause / Core Insight
- **Smart Scroll Header**:
  - Hiding on downward scroll (`scrollY > 60px` with `delta > 8px`) reclaims ~15–20% of vertical screen real estate for artwork and descriptions.
  - Revealing on upward scroll (`delta < -8px`) or top-of-page (`scrollY <= 10px`) keeps navigation and search accessible without scrolling back to the top.
  - Suppressing auto-hide during drawer or modal open states prevents unexpected viewport jumping.
- **Mobile Clearance & Insets**:
  - Adding `padding-bottom: calc(var(--space-8) + 64px + env(safe-area-inset-bottom, 0px))` on `.footer-shell` ensures full legal copy visibility with positive clearance above the floating bar.
  - Using dynamic `padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px))` on `.mobile-bottom-bar` avoids icon compression over iOS/Android gesture lines.

### The Pattern (Transferable)
- For responsive web apps with fixed bottom bars:
  1. Use GPU-composited `transform: translateY(-100%)` with passive scroll delta math for the top header.
  2. Always add explicit `calc(...)` bottom clearance on footer containers in mobile media queries.
  3. Support `touch-action: manipulation;` and luminous active tab states for native tactile responsiveness.

---

## [Pattern] Steam Global Download Tray & Background Queue State Machine

### Context
- File downloads in SPAs often happen in isolation without global visibility across route transitions.
- Users navigating between store catalog, creator studio, and library lose track of active package installation.

### Root Cause / Core Insight
- **Global Signal Store**: Decoupling download state into an injectable root service (`DownloadService`) enables persistent background transfer emulation (`activeDownloads`, `isTrayOpen`, `isTrayExpanded`).
- **Docked Steam Deck Tray Component**: Mounting `<app-download-tray>` at the root `AppComponent` shell ensures downloads remain visible and controllable regardless of active Angular router outlets.
- **Realistic Transfer Emulation**: Emulating chunk transfers with realistic speed telemetry (`52.1 MB/s`) and dynamic completion CTAs (`[ Play ]` linking directly to `/games/:id`) gives users immediate feedback and a native desktop client feel.

### The Pattern (Transferable)
1. Store background task queues in dedicated Angular Signal services (`computed()` total progress, active count).
2. Project global tray components outside `<router-outlet>` in `app.component.ts`.
3. Provide one-click launch / dismiss controls with automatic 100% completion status flips.

---

## [Pattern] iOS WebKit 120Hz ProMotion Kinetic Scrolling & GPU Isolation

### Context
- Desktop web applications with `html { scroll-behavior: smooth; }` often exhibit rubbery lag, micro-stutters, and scroll traps on iOS Safari.
- Nested `overflow-y: auto` containers fight for touch momentum on mobile viewports.

### Root Cause / Core Insight
- **ProMotion Collision**: iOS Safari's native 120Hz kinetic scroll engine conflicts with CSS `scroll-behavior: smooth` interpolation. Overriding with `@supports (-webkit-touch-callout: none) { html, body { scroll-behavior: auto !important; } }` restores native ProMotion momentum.
- **Single Scroll Layer**: Setting the parent drawer to `overflow: hidden` and the inner list to `overflow-y: scroll; -webkit-overflow-scrolling: touch; touch-action: pan-y;` eliminates double-scroll fighting.
- **RAF Batching**: Throttling `window:scroll` calculations with `requestAnimationFrame` prevents main-thread signal thrashing during rapid mouse wheel and touch panning.

### The Pattern (Transferable)
1. Disable CSS smooth scroll on iOS touch devices to unleash native WebKit hardware kinetic deceleration.
2. Isolate modal and drawer scroll physics to a single inner container with `touch-action: pan-y;`.
3. Always batch DOM measurements inside `requestAnimationFrame` before mutating Angular Signals on scroll.






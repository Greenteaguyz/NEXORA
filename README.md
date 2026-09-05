# NEXORA Developer Guide

NEXORA is a cyberpunk and indie game distribution marketplace built with Angular 18+ standalone components, reactive Signals, and interface-driven dependency injection (DI).

This guide walks you through setting up your local development environment, running the application, executing the automated test battery, and exploring the architectural documentation suite.

---

## Before you begin

Verify that your system meets the following prerequisites:

1. **Node.js**: Version 18.13.0 or later.
2. **npm**: Version 9.0.0 or later.
3. **Angular CLI** (optional for global commands): Version 18.0.0 or later.

Run the following commands to check your installed versions:

```bash
node -v
npm -v
```

---

## Quickstart

Follow these steps to install dependencies and launch the application locally.

### 1. Install project dependencies

Run `npm install` in the project root directory:

```bash
npm install
```

### 2. Start the local development server

Start the Angular development server:

```bash
npm start
```

The development server compiles the TypeScript bundles and listens on port 4200 by default.

### 3. Open the application in your browser

Navigate to [`http://localhost:4200`](http://localhost:4200) in your web browser.

> [!NOTE]
> The application includes seeded mock data for games, user accounts, purchases, and library states. You do not need to configure an external database to test features locally.

---

## Overview & Key Features

* **Store Catalog & Showcase Carousel**: Featured & Recommended 16:9 cinema stage with synchronized 4-thumbnail filmstrip previewing on hover, 5-second autoplay with pause-on-hover, spatial keyboard arrows (<kbd>←</kbd> / <kbd>→</kbd>), and dynamic ambient color backlighting.
* **Game Hover Card Preview Popover**: Fast `300ms` debounce popover with 16:9 screenshot auto-cycling (2.5s), review sentiment score (*Very Positive — 89%*), developer credit, and collision-free viewport flip positioning.
* **Store Context Menu System**: Custom right-click overlay (`[appContextMenu]`) with rapid game actions (*Play / Download*, *Wishlist*, *Copy Store Link*, *View Details*) and full keyboard arrow/Escape navigation.
* **Creator Studio Data Table (`DataTable`)**: Generic standalone data table component with multi-field search filtering, column sort indicators (asc/desc), and pagination controls.
* **Smooth Fluid Clamping & Dynamic Geometry**: Mathematical linear-slope interpolation (`clamp(MIN, calc(MIN_REM + SLOPE_VW), MAX)`) eliminating mobile dead zones across 360px mobile handhelds to 3840px 4K / Ultrawide displays.
* **Account Payment & Wallet Architecture**: Dedicated `/account/payment` hub with credit card management, Cambodian National Bank KHQR Bakong mobile payment integration (exclusive to creator payout profiles), prepaid gift card redemption with 4-letter auto-dashing, real-time wallet balances, clickable transaction history with audit details modal, and compact tactile modal action buttons.
* **Inline Checkout & ABA PayWay KHQR Rail**: Shared `AddPaymentMethodFormComponent` for seamless inline card/KHQR addition, plus focused `AbaPaywaySheetComponent` scan card with dynamic 5-minute countdown and instant status polling.
* **Automated 90/10 Creator Settlement**: Instant automated revenue split executed on order confirmation: 90% credited to creator wallet and royalty ledger, 10% platform commission retained in `platform_treasury`.
* **Card-Only Buyer Enforcement**: Regular buyers are strictly constrained to Credit / Debit Card funding sources and card-only wallet top-ups, with zero KHQR tabs rendered in Add Method modals.
* **Payment Finance Core & Payment Revert**: Integer minor unit `Money` model, 8-state `PaymentIntent` finite state machine, tender allocation with overpayment guards, idempotency caching, and automated wallet refunding (`refund_credit` ledger entry) upon paid-game library removal.
* **Universal Account Password & Security Protection**: Hardened password policy, brute-force lockout safeguards (5 attempts with 60-second cooldown), and modal logout confirmation with backdrop blur and safe data callout.
* **Creator Studio Lifecycle & Safety Lock**: Full CRUD game listings with interactive `TagChipInput`, 5.5s auto-dismissing draft banner with hover pause/resume, Recycle Bin restore/purge, and a 5-second countdown safety lock on permanent game deletions.
* **Game Acquisition & Download Experience**: Streamlined 2-tier acquisition banner, dual-platform options (**Windows 32/64-bit** and **Linux x86_64**), 1-click **Add to Library / Claim** for free games, SHA-256 integrity checksum verification, and animated download progress overlays.
* **Steam Global Bottom Download Tray**: Docked bottom status bar with real-time transfer speeds, reactive signals (`activeDownloads`, `isTrayOpen`), expandable itemized package management, and direct `[ Play ]` launch controls.
* **Resilient Toast Notification Queue**: Multi-severity notifications (`success`, `info`, `warning`, `error`), hover/focus pause, stack cap (3), composite deduplication, double-fire guarded undo callbacks, and smooth 180ms CSS exit animations.
* **Ref-Counted Scroll Lock Engine**: `ScrollLockService` and `[appScrollLock]` directive wired into 15 fullscreen overlays, utilizing iOS `position: fixed` scroll compensation and scrollbar gutter shift balancing.
* **Hardware-Accelerated & iOS 120Hz ProMotion Smooth Scrolling**: RAF-batched scroll listener, native iOS WebKit touch physics bypass (`scroll-behavior: auto !important` on touch devices), single-scroll layer mobile drawer, and hardware GPU compositing (`transform: translate3d(0,0,0)`).
* **Universal Category Rail Edge Fade Masks**: Standardized linear gradient edge masks across Catalog, Library, and Wishlist chip carousels.
* **Universal Keyboard Escape & Modal Dismissal**: Accessible HostListener Escape key dismissal across all modals (Receipts, Warning popups, Studio dialogs).
* **Library Management & Owned Badges**: Catalog cards project live ownership badges (`Owned`), with 1-click **Remove from Library** and instant cross-persona state synchronization.
* **Executive Invoicing & Receipts**: High-resolution 1-page A4 printable invoice with zero browser URL stamps (`@page { margin: 0; }`), automatic PDF naming (`NEXORA-Receipt-ord_XXX.pdf`), customer metadata (`Billed To`), and itemized accounting breakdowns.
* **Speedtest.net Dual-Segment Theme Switcher**: Authentic sliding capsule switcher with Warm Amber (`#F59E0B`) Sun illumination and Electric Cyan (`#66C0F4`) Moon illumination.
* **Unified Steam Deck Hub Mobile Navigation**: Zero-scroll compact layout with integrated 2-row footer control card, pixel-aligned icon/label grid, keyboard focus trapping, and WCAG AAA contrast ratios.
* **Smart Scroll-Aware Header & Mobile Clearance**: Auto-hiding header on downward scroll (`transform: translateY(-100%)`) to reclaim 15–20% vertical viewport, smooth slide-down reveal on upward scroll, and dynamic `padding-bottom` clearance on footer and bottom bar for 100% unclipped legal text and safe-area insets.
* **Hero Carousel Touch Drag & Swipe Motion Architecture**: Hardware-accelerated dual-phase crossfade (`scale(1.015) -> 1.0` over `350ms`), coordinated info reveal, touch/pointer drag-to-swipe physics with 40px threshold, spatial `ArrowLeft`/`ArrowRight` navigation, tap-vs-drag disambiguation, and glowing Electric Cyan pagination pills.
* **Rich Media & Visual Polish**: Official high-res game assets (featuring *Marvel Rivals*), dual-theme system (Dark & Light modes), Light Mode soft slate frosted backdrop blur for full-screen screenshot lightbox viewing, and 100% fluid edge-to-edge layout scaling.
* **Role-Based Access Control & Multi-Persona**: Instant demo persona switching (Alice - Creator/Buyer, Bob - Buyer), creator upload studio, library management, and purchase fulfillment.
* **Comprehensive Khmer (kh) Localization**: Native bilingual i18n support across all 13 application views, 100% dictionary parity (200 keys each), on-demand lazy chunk loading (23.9 kB), and Latin-first font stack ordering to prevent numeral and code glyph hijacking.
* **Creator Studio 3-Step Game Wizard**: Responsive step tab panels (`Basic Info & Pricing`, `Artwork & Media`, `System Specs & Details`), unsaved changes guard, draft autosave, and 30-day soft-delete recycle bin.
* **Grounded Account Password & Profile UX**: Clear noun-verb separation (`Account Password` header + `Change Password` action), brute-force lockout safeguards, and high-contrast theme styling.

---

## Demo credentials

Use the following preconfigured accounts to test role-based access control and user workflows:

| Persona | Role | Email | Password | Granted Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Alice** | Creator + Buyer | `alice@nexora.io` | `password123` | Full access to Creator Studio, game publishing, editing owned listings, purchasing games, and configuring ABA Bakong KHQR creator payout rails. |
| **Bob** | Buyer | `bob@nexora.io` | `password123` | Browse catalog, wishlist games, complete order checkout, manage personal library, and manage credit cards (cards only). |

---

## Run automated test suites

NEXORA provides a comprehensive automated testing battery covering unit logic, domain integration, master architectural invariants, Playwright E2E journeys, and the Impeccable Anti-Slop / Steam DesignMD compliance suite.

### 1. Run all regression suites (1,048 Tests — 100% Pass Rate)

Execute all automated test tiers:

```bash
npm test
# OR
npm run test:regression
```

This command orchestrates:
* **Unit Tests** (`npm run test:unit`): 687 assertions across 100+ sections verifying email/password validations, 90/10 creator revenue splits, data transforms, context menu positioning, hover card debouncing/flipping, data table sorting/filtering/pagination, showcase carousel slide index navigation/active media resolution, `nexora_*` storage prefix isolation, fluid clamp bounds, 4-slide hero geometry parity, Speedtest theme switcher geometry, Unified Steam Deck Hub mobile drawer dimensions, carousel touch swipe gestures / keyboard navigation, smart scroll-aware header / mobile footer clearance, Steam bottom download tray signals, iOS 120Hz ProMotion scroll kinetic physics, header navigation animations, card number grouping / CVV directives, universal account password security logic, lockout backoff, and toast queue eviction/pause mechanics.
* **Integration Tests** (`npm run test:integration`): 324 assertions across 28 sections verifying Alice/Bob persona lifecycles, query engine, commerce checkout with Mastercard/KHQR, wishlist-to-library fulfillment, route guards, `/studio/games/new` permissions, unsaved changes guards, multi-persona state synchronization, inline checkout payment methods, ABA PayWay modal flows, finance ledger integrity, paid-game removal purchase reversions, buyer card-only isolation, gift voucher auto-dashing, and detailed transaction modal controls.
* **Master Battery** (`npm run test:master`): 23 tests verifying dataset invariants, ownership verification, ref-counted scroll lock state transitions, toast queue dedupe/expiration, URL sanitization against open redirects, card number grouping, and expiry formatting.
* **Impeccable Anti-Slop Suite** (`npm run test:impeccable`): 7 tests asserting absence of neon glow halos, strict radii hierarchy (`2px/4px/6px/8px/16px`), snappy `0.15s` transitions, and WCAG AAA contrast ratios.
* **Theme Contrast Suite** (`npm run test:theme-contrast`): 7 tests asserting high-contrast overrides across Wishlist, Library, Genres, and Modals in Light Mode.
* **Playwright E2E Journeys** (`npm run test:e2e`): Automated multi-step browser user journeys with 100% pass rate.
* **Dedicated Node Stress Suites** (`tests/stress/*.ts`): High-throughput stress suites for boundary fuzzing, finance invariants, checkout add-method, password lockout, and UI/UX polish.

### 2. Run full build & regression verification gate

```bash
npm run verify
```

Executes `npm run build` followed by `npm run test:regression`. Zero warnings or errors permitted.

---

## Build for production

To generate optimized production bundles:

```bash
npm run build
```

The compiled assets are generated in the `dist/nexora/browser` directory.

### Performance metrics

* **Initial Transfer Size**: `143.06 kB` (71.4% below the 500 kB budget)
* **Main JavaScript Bundle**: `25.32 kB`
* **Production Build Speed**: `~3.4s` using the Angular esbuild application builder
* **DOM Interactive**: `~38ms` on standard desktop and mobile browsers
* **Core Web Vitals**: FCP `~340ms`, LCP `~620ms`, CLS `0.00` (Zero Cumulative Layout Shift), INP `< 35ms`

---

## Public preview and deployment options

### Live Cloudflare tunnel preview

When running public QA testing, launch a Cloudflare tunnel to expose your local instance securely:

```bash
cloudflared.exe tunnel --url http://localhost:4200
```

* **Live Demo URL**: [https://mom-bet-races-devoted.trycloudflare.com](https://mom-bet-races-devoted.trycloudflare.com)

### Deploy to Vercel

The repository includes a [`vercel.json`](file:///c:/Users/User/Downloads/AngularProject/vercel.json) configuration file to handle Single Page Application (SPA) routing:

```bash
npx vercel --prod
```

---

## Documentation directory

NEXORA documentation follows the [Diataxis Framework](https://diataxis.fr/), separating documentation into tutorials, how-to guides, reference material, and architectural explanations.

```
                  PRACTICAL                              THEORETICAL
           ┌──────────────────────────────────────┬──────────────────────────────────────┐
LEARNING   │            1. TUTORIALS              │            4. EXPLANATION            │
           ├──────────────────────────────────────┼──────────────────────────────────────┤
WORKING    │             2. HOW-TOS               │             3. REFERENCE             │
           └──────────────────────────────────────┴──────────────────────────────────────┘
```

### 1. Tutorials (Learning-oriented)
* [Tutorial: Getting started](file:///c:/Users/User/Downloads/AngularProject/docs/tutorial-getting-started.md) — Step-by-step setup, directory structure, and design token integration.
* [Tutorial: Implementing the gated download flow](file:///c:/Users/User/Downloads/AngularProject/docs/tutorial-download-flow.md) — Construction of the 5-state dynamic download button and acquisition workflow.

### 2. How-to guides (Task-oriented)
* [How to configure the authentication and guard system](file:///c:/Users/User/Downloads/AngularProject/docs/howto-auth-system.md) — Implement Signal-based authentication, role permissions, and functional guards with deep-link redirects.
* [How to add and swap data services using dependency injection](file:///c:/Users/User/Downloads/AngularProject/docs/howto-data-layer.md) — Register and swap interface-driven `InjectionToken` services without modifying UI components.
* [How to build catalog and game detail views](file:///c:/Users/User/Downloads/AngularProject/docs/howto-catalog-detail.md) — Implement dynamic tag filters, substring search, and responsive game detail views.
* [How to implement the Creator Studio](file:///c:/Users/User/Downloads/AngularProject/docs/howto-creator-studio.md) — Build creator listings tables, tag chip inputs, and soft-deletion operations.

### 3. Reference (Information-oriented)
* [Data models reference](file:///c:/Users/User/Downloads/AngularProject/docs/reference-data-models.md) — TypeScript interface definitions, field constraints, and entity schemas.
* [API and data services reference](file:///c:/Users/User/Downloads/AngularProject/docs/reference-api-services.md) — Method signatures, return types, and DI token constants.
* [Routes and guards reference](file:///c:/Users/User/Downloads/AngularProject/docs/reference-routes-guards.md) — Central routing table, guard chains, and authorization matrix.

### 4. Explanation (Understanding-oriented)
* [Why NEXORA uses a dependency injection abstraction layer](file:///c:/Users/User/Downloads/AngularProject/docs/explanation-di-abstraction.md) — Architectural rationale for decoupling data sources from UI components.
* [Architecture of the gated download flow](file:///c:/Users/User/Downloads/AngularProject/docs/explanation-download-flow.md) — State machine transition model and session persistence design.

---

## Architectural specifications
* [Storefront & Player Workflow Diagram](file:///c:/Users/User/Downloads/AngularProject/docs/diagrams/app-flow-workflow.html) — Visual, interactive SVG workflow diagram of the storefront, neutral checkout, ownership fulfillment, and Steam download tray.
* [Creator Studio Lifecycle Diagram](file:///c:/Users/User/Downloads/AngularProject/docs/diagrams/creator-lifecycle-workflow.html) — Interactive workflow of the 3-step game wizard, unsaved changes guard, draft autosave, 30-day recycle bin, and 90% KHQR royalty payout.
* [Architecture Codemaps Suite](file:///c:/Users/User/Downloads/AngularProject/docs/CODEMAPS/architecture.md) — Token-lean architectural codemaps covering system topology, frontend routes, data models, services, and dependencies.
* [Frontend architecture specification](file:///c:/Users/User/Downloads/AngularProject/frontend-architecture.md) — Technical specification covering state management, reactive patterns, and design tokens.
* [Pages and components map](file:///c:/Users/User/Downloads/AngularProject/pages_components_map.md) — Component registry, wireframes, and dependency graph.
* [Site architecture](file:///c:/Users/User/Downloads/AngularProject/site_architecture.md) — Routing schema, guard flowcharts, and sitemap.
* [Solo build plan](file:///c:/Users/User/Downloads/AngularProject/design_doc.md) — Milestone execution plan, scope triage, and Decision Audit Trail.
* [Tracked engineering tasks](file:///c:/Users/User/Downloads/AngularProject/TODOS.md) — Engineering milestones and active delivery tracker.

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

* **Store Catalog & Genres Directory**: Real-time substring search, live tag filtering, quick-search genre catalog, and responsive auto-fill category grids with game counts.
* **Game Acquisition & Download Experience**: Streamlined 2-tier acquisition banner, dual-platform options (**Windows 32/64-bit** and **Linux x86_64**), 1-click **Add to Library / Claim** for free games, SHA-256 integrity checksum verification, and animated download progress overlays.
* **Library Management**: 1-click **Remove from Library** with live state synchronization and persistent storage.
* **Executive Invoicing & Receipts**: High-resolution 1-page A4 printable invoice with zero browser URL stamps (`@page { margin: 0; }`), automatic PDF naming (`NEXORA-Receipt-ord_XXX.pdf`), customer metadata (`Billed To`), and itemized accounting breakdowns.
* **Speedtest.net Dual-Segment Theme Switcher**: Authentic sliding capsule switcher with Warm Amber (`#F59E0B`) Sun illumination and Electric Cyan (`#66C0F4`) Moon illumination.
* **Unified Steam Deck Hub Mobile Navigation**: Zero-scroll compact layout with integrated 2-row footer control card, pixel-aligned icon/label grid, keyboard focus trapping, and WCAG AAA contrast ratios.
* **Hero Carousel Touch Drag & Swipe Motion Architecture**: Hardware-accelerated dual-phase crossfade (`scale(1.015) -> 1.0` over `350ms`), coordinated info reveal, touch/pointer drag-to-swipe physics with 40px threshold, spatial `ArrowLeft`/`ArrowRight` navigation, tap-vs-drag disambiguation, and glowing Electric Cyan pagination pills.
* **Rich Media & Visual Polish**: Official high-res game assets (featuring *Marvel Rivals*), dual-theme system (Dark & Light modes), Light Mode soft slate frosted backdrop blur for full-screen screenshot lightbox viewing, and 100% fluid edge-to-edge layout scaling.
* **Role-Based Access Control & Multi-Persona**: Instant demo persona switching (Alice - Creator/Buyer, Bob - Buyer), creator upload studio, library management, and purchase fulfillment.

---

## Demo credentials

Use the following preconfigured accounts to test role-based access control and user workflows:

| Persona | Role | Email | Password | Granted Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Alice** | Creator + Buyer | `alice@nexora.io` | `password123` | Full access to Creator Studio, game publishing, editing owned listings, and purchasing games. |
| **Bob** | Buyer | `bob@nexora.io` | `password123` | Browse catalog, wishlist games, complete order checkout, and manage personal library. |

---

## Run automated test suites

NEXORA provides a comprehensive automated testing battery covering unit logic, domain integration, master architectural invariants, broken-link crawling, Playwright E2E journeys, and the Impeccable Anti-Slop / Steam DesignMD compliance suite.

### 1. Run all regression suites (234 Tests — 100% Pass Rate)

Execute all automated test tiers:

```bash
npm test
# OR
npm run test:regression
```

This command orchestrates:
* **Unit Tests** (`npm run test:unit`): 142 assertions across 27 sections verifying email/password validations, 90/10 creator revenue splits, data transforms, `nexora_*` storage prefix isolation, fluid clamp bounds, 4-slide hero geometry parity, Speedtest theme switcher geometry, Unified Steam Deck Hub mobile drawer dimensions, and carousel touch swipe gestures / keyboard navigation.
* **Integration Tests** (`npm run test:integration`): 46 assertions across 7 sections verifying Alice/Bob persona lifecycles, query engine, wishlist-to-library fulfillment, route guards, `/studio/games/new` permissions, and multi-persona state synchronization.
* **Master Battery** (`npm run test:master`): 10 tests verifying dataset invariants, ownership verification, and dual-theme DOM state sync.
* **Impeccable Anti-Slop Suite** (`npm run test:impeccable`): 7 tests asserting absence of neon glow halos, strict radii hierarchy (`2px/4px/6px/8px/16px`), snappy `0.15s` transitions, and WCAG AAA contrast ratios.
* **Broken-Link Crawler** (`npm run test:crawler`): 24 crawled URLs verifying zero 404 dead links across catalog, games, genres, creators, and studio forms.
* **Playwright E2E Journeys** (`npm run test:e2e`): 5 automated multi-step browser user journeys with 100% pass rate.

### 2. Run full build & regression verification gate

```bash
npm run verify
```

Executes `npm run build` followed by `npm run test:regression`.

---

## Build for production

To generate optimized production bundles:

```bash
npm run build
```

The compiled assets are generated in the `dist/nexora/browser` directory.

### Performance metrics

* **Initial Transfer Size**: `96.87 kB` (80.6% below the 500 kB budget)
* **Main JavaScript Bundle**: `7.65 kB`
* **Initial CSS**: `1.09 kB` (inlined critical CSS)
* **Production Build Speed**: `~2.3s` using the Angular esbuild application builder
* **DOM Interactive**: `~38ms` on standard desktop and mobile browsers

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

* [Frontend architecture specification](file:///c:/Users/User/Downloads/AngularProject/frontend-architecture.md) — Technical specification covering state management, reactive patterns, and design tokens.
* [Pages and components map](file:///c:/Users/User/Downloads/AngularProject/pages_components_map.md) — Component registry, wireframes, and dependency graph.
* [Site architecture](file:///c:/Users/User/Downloads/AngularProject/site_architecture.md) — Routing schema, guard flowcharts, and sitemap.
* [Solo build plan](file:///c:/Users/User/Downloads/AngularProject/design_doc.md) — Milestone execution plan, scope triage, and Decision Audit Trail.
* [Tracked engineering tasks](file:///c:/Users/User/Downloads/AngularProject/TODOS.md) — Engineering milestones and active delivery tracker.

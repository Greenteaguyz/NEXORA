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

## Demo credentials

Use the following preconfigured accounts to test role-based access control and user workflows:

| Persona | Role | Email | Password | Granted Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Alice** | Creator + Buyer | `alice@nexora.io` | `password123` | Full access to Creator Studio, game publishing, editing owned listings, and purchasing games. |
| **Bob** | Buyer | `bob@nexora.io` | `password123` | Browse catalog, wishlist games, complete order checkout, and manage personal library. |
| **Carol** | Creator | `carol@nexora.io` | `password123` | Creator Studio access and management for Carol's published games. |

---

## Run automated test suites

NEXORA provides a comprehensive automated testing battery with 250+ checks covering unit logic, domain integration, end-to-end browser flows, WCAG accessibility, and mobile emulation.

### 1. Run the domain regression suite

Run the TypeScript domain regression test suite to verify contract parity, session isolation, and catalog fulfillment:

```bash
npm run test:regression
```

### 2. Run the end-to-end workflow validation suite

Run the Playwright end-to-end test suite to validate catalog browsing, login, purchasing, and creator workflows:

```bash
npx tsc src/app/core/tests/rigorous-validation-suite.ts --outDir dist/tests --module commonjs --target es2022 --skipLibCheck
node dist/tests/rigorous-validation-suite.js http://localhost:4200
```

### 3. Run the deep security, accessibility, and chaos battery

Execute the combined deep test battery covering WCAG 2.1 AA/AAA accessibility, XSS injection resistance, purchase debouncing, corrupted storage auto-recovery, and memory leak stress testing:

```bash
npx tsc src/app/core/tests/ultimate-deep-battery.ts --outDir dist/tests --module commonjs --target es2022 --skipLibCheck
node dist/tests/ultimate-deep-battery.js http://localhost:4200
```

### 4. Run the mobile touch and device emulation audit

Execute touch interaction testing across iPhone 14 Pro, Google Pixel 7, and iPhone SE emulations:

```bash
npx tsc src/app/core/tests/mobile-ui-ux-deep-test.ts --outDir dist/tests --module commonjs --target es2022 --skipLibCheck
node dist/tests/mobile-ui-ux-deep-test.js http://localhost:4200
```

### 5. Run the route redirect and guard audit

Validate that all route guards (`authGuard`, `roleGuard`, `ownershipGuard`) and deep-linking query parameters resolve correctly:

```bash
npx tsc src/app/core/tests/redirect-logic-audit.ts --outDir dist/tests --module commonjs --target es2022 --skipLibCheck
node dist/tests/redirect-logic-audit.js http://localhost:4200
```

---

## Build for production

To generate optimized production bundles:

```bash
npm run build
```

The compiled assets are generated in the `dist/nexora/browser` directory.

### Performance metrics

* **Initial Transfer Size**: `92.8 kB` (81.4% below the 500 kB budget)
* **Main JavaScript Bundle**: `7.65 kB`
* **Initial CSS**: `1.09 kB` (inlined critical CSS)
* **Production Build Speed**: `~2.4s` using the Angular esbuild application builder

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

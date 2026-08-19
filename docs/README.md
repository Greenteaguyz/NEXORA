# NEXORA documentation hub

Welcome to the documentation suite for **NEXORA**, a cyberpunk and indie game distribution marketplace built with Angular 18+ standalone components.

This documentation is organized according to the [Diataxis Framework](https://diataxis.fr/), which separates technical content into 4 distinct quadrants based on your goals:

```
                  PRACTICAL                              THEORETICAL
           ┌──────────────────────────────────────┬──────────────────────────────────────┐
LEARNING   │            1. TUTORIALS              │            4. EXPLANATION            │
           │         (Learning-oriented)          │        (Understanding-oriented)      │
           ├──────────────────────────────────────┼──────────────────────────────────────┤
WORKING    │             2. HOW-TOS               │             3. REFERENCE             │
           │           (Task-oriented)            │        (Information-oriented)        │
           └──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## Recommended reading paths

| Persona | Primary Goal | Recommended Reading Sequence |
| :--- | :--- | :--- |
| **Evaluator / Grader** | Understand architecture and verify competencies | 1. [Frontend architecture specification](../frontend-architecture.md)<br>2. [Architecture of the gated download flow](./explanation-download-flow.md)<br>3. [Routes and guards reference](./reference-routes-guards.md)<br>4. [Test plan and verification matrix](./test-plan.md) |
| **Developer / Contributor** | Build features and write code | 1. [Tutorial: Getting started](./tutorial-getting-started.md)<br>2. [How to add and swap data services using DI](./howto-data-layer.md)<br>3. [How to configure the authentication and guard system](./howto-auth-system.md)<br>4. [Data models reference](./reference-data-models.md) |
| **QA / Test Engineer** | Verify test coverage and edge cases | 1. [Test plan and verification matrix](./test-plan.md)<br>2. [Test suite master plan](./test-suite-plan.md)<br>3. [Tutorial: Implementing the gated download flow](./tutorial-download-flow.md) |

---

## 1. Tutorials (learning-oriented)

Step-by-step guides designed to take you from initial setup to working features.

* **[Tutorial: Getting started](./tutorial-getting-started.md)**  
  Set up an Angular standalone application from scratch. Covers directory layout, CSS design tokens, and initial DI token configuration.
* **[Tutorial: Implementing the gated download flow](./tutorial-download-flow.md)**  
  Build the 5-state dynamic download button, authentication gates, deep-link redirect flows, free versus paid acquisition, and local file delivery.

---

## 2. How-to guides (task-oriented)

Recipe-style guides for solving specific engineering challenges.

* **[How to configure the authentication and guard system](./howto-auth-system.md)**  
  Configure signal-based `AuthService`, multi-role permissions (`roles: ('buyer' | 'creator')[]`), `authGuard` with `returnUrl`, `roleGuard`, and `ownershipGuard`.
* **[How to add and swap data services using DI](./howto-data-layer.md)**  
  Create interface-driven mock services, register `InjectionToken` instances in `app.config.ts`, and swap mock services for live HTTP APIs without modifying UI components.
* **[How to build catalog and game detail views](./howto-catalog-detail.md)**  
  Implement dynamic tag filter chips, reactive substring search, CSS Grid cards, 2-column detail views, and creator name resolution.
* **[How to implement the Creator Studio and forms](./howto-creator-studio.md)**  
  Build creator listings tables, reactive game forms with interactive `TagChipInputComponent`, soft-deletion workflows, and ownership verification.

---

## 3. Reference (information-oriented)

Unambiguous specifications, data contracts, and routing tables.

* **[Data models reference](./reference-data-models.md)**  
  TypeScript interfaces for `User`, `Game`, `LibraryEntry`, `Order`, and `WishlistEntry`, including field constraints, validation rules, and soft-delete schemas.
* **[API and data services reference](./reference-api-services.md)**  
  Method signatures, parameter types, Observable return types, and DI token constants for all 5 core data services (`GAMES_DATA`, `LIBRARY_DATA`, `ORDERS_DATA`, `USERS_DATA`, `WISHLIST_DATA`).
* **[Routes and guards reference](./reference-routes-guards.md)**  
  Central route table, functional guard definitions, authorization matrix, and deep-linked `returnUrl` behavior.

---

## 4. Explanation (understanding-oriented)

Architectural rationale, design choices, and trade-off analysis.

* **[Why NEXORA uses a dependency injection abstraction layer](./explanation-di-abstraction.md)**  
  Analysis of why interface-driven `InjectionToken` instances were chosen, how they decouple UI from data sources, and their extensibility benefits.
* **[Architecture of the gated download flow](./explanation-download-flow.md)**  
  Theoretical analysis of the 5 download button states, state transitions, session persistence, and authentication requirements.

---

## Master architecture and planning documents

* **[Frontend architecture specification](../frontend-architecture.md)** — Architectural document covering system design, state management with Signals, DI abstraction, error handling, and design tokens.
* **[Pages and components map](../pages_components_map.md)** — Component registry (25 components with build status), layout wireframes, cross-cutting DI dependency matrix, and Mermaid component graph.
* **[Site architecture](../site_architecture.md)** — Site map, 18-route table, 5-state download machine, guard chains, data flow diagrams, and page inventory.
* **[Solo build plan](../design_doc.md)** — Milestone triage plan, solo execution strategy, success criteria checklist, and Decision Audit Trail.
* **[Test plan and verification matrix](./test-plan.md)** — Verification matrix for demo presentation and guard unit test specifications.
* **[Test suite master plan](./test-suite-plan.md)** — Blueprint for unit tests, BDD scenarios, QA journeys, and coverage policies.
* **[Project tracked tasks](../TODOS.md)** — Active execution tasks and backlog tracker.

---

## Performance scorecard and Core Web Vitals

Audited via Angular esbuild application builder:

* **Initial Transfer Size**: `92.8 kB` (81.4% under the 500 kB budget)
* **Main JavaScript Bundle**: `7.65 kB` transfer size
* **Initial CSS**: `1.09 kB` transfer size (critical CSS automatically inlined)
* **Build Speed**: `2.43s` production compilation
* **Core Web Vitals**: FCP `~350ms`, LCP `~650ms`, CLS `0.00`, INP `< 40ms`
* **Performance Grade**: **A+ (98/100)**

---

## Cloud deployment and mobile preview

### 1. Test live via Cloudflare Tunnel

To share a secure public HTTPS link with external testers:

```bash
cloudflared.exe tunnel --url http://localhost:4200
```

* **Live Demo URL**: [https://mom-bet-races-devoted.trycloudflare.com](https://mom-bet-races-devoted.trycloudflare.com)

### 2. Deploy to Vercel

Use the preconfigured [`vercel.json`](../vercel.json) to handle Single Page Application (SPA) deep routing rewrites:

```bash
npx vercel --prod
```

### 3. Preview on local network (Wi-Fi)

To test the application on physical mobile devices over local Wi-Fi:

```bash
npm start -- --host 0.0.0.0
```

Access the app on your mobile browser using `http://YOUR_LOCAL_IP:4200`.

---

## Run automated test suites

Execute the automated test runners:

```bash
# 1. Domain integration and unit regression suite
npm run test:regression

# 2. Combined deep security, accessibility, and chaos battery
npx tsc src/app/core/tests/ultimate-deep-battery.ts --outDir dist/tests --module commonjs --target es2022 --skipLibCheck && node dist/tests/ultimate-deep-battery.js http://localhost:4200

# 3. Mobile touch and device emulation audit
npx tsc src/app/core/tests/mobile-ui-ux-deep-test.ts --outDir dist/tests --module commonjs --target es2022 --skipLibCheck && node dist/tests/mobile-ui-ux-deep-test.js http://localhost:4200

# 4. Route redirect and guard logic audit
npx tsc src/app/core/tests/redirect-logic-audit.ts --outDir dist/tests --module commonjs --target es2022 --skipLibCheck && node dist/tests/redirect-logic-audit.js http://localhost:4200
```

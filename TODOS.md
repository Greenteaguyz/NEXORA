# NEXORA — Project Implementation Tasks & TODOs

This document tracks all implementation tasks for the **NEXORA** cyberpunk and indie game marketplace capstone project in sequential order, replacing the day-by-day plan with actionable, milestone-driven task checklists.

> ⚠️ **This document is derived from [`design_doc.md`](design_doc.md), which is authoritative on scope, sequencing, and Tier decisions** (see its Document Precedence section). Two corrections from the 2026-08-17 council review are reflected below: Creator Studio (Task 9) is **committed, minimal scope**, not a stretch goal; and Wishlist follows the same DI-token pattern as Library/Orders.
>
> 📋 **Full Test Suite Plan:** [test-suite-plan.md](docs/test-suite-plan.md) is **aspirational / post-capstone reference material, not a build requirement.** The only testing commitment for this capstone is Task 10.1 below (Jest unit tests for `download-button` and the route guards). Do not pull in its BDD/E2E/mutation-testing layers under the 10-day deadline.

---

## Agent Execution & Quality Workflow

Standard skills to apply during and after each development task:

### 🔄 During Task Execution (Active Monitoring & Guardrails)
- [ ] **TDD & Regression Coverage**: Follow `tdd-workflow` (write tests first) and `ai-regression-testing` (catch AI blindspots).
- [ ] **Safety & Scoping**: Use `careful` / `guard` / `freeze` to safeguard against destructive commands and scope file edits.
- [ ] **Write-Time Code Quality**: Apply `plankton-code-quality` for auto-formatting, linting, and write-time fixes.
- [ ] **Context Budgeting**: Use `strategic-compact` at logical milestones to maintain optimal token efficiency.
- [ ] **Real-Time Learning & Memory**: Leverage `continuous-learning-v2` (instinct capture) and `ck` (persistent project context).
- [ ] **Rule Enforcement**: Ensure compliance with configured `hookify-rules`.

### ✅ After Task Execution (Verification, QA & Review)
- [ ] **Delivery Gate**: Enforce `delivery-gate` to prevent declaring done before all quality checks pass.
- [ ] **Verification Loop**: Execute `verification-loop` to validate behavior, compilation, and test correctness.
- [ ] **Self-Evaluation**: Run `agent-self-evaluation` to score output across accuracy, completeness, clarity, actionability, and conciseness (1–5 scale).
- [ ] **Growth & Learning Capture**: Record reusable patterns with `growth-log` and manage learnings with `learn`.
- [ ] **Visual & Functional QA**: Use `browse` / `browser-qa` / `qa-only` for UI and interactive feature validation.
- [ ] **Code Review & Auditing**: Run `review` for diff inspections, `production-audit` for readiness checks, and `canary` / `retro` for post-deploy monitoring and metrics.

---

## Phase 1: Foundation (Tasks 1–2)

### Task 1: Project Scaffold & Core Layer Setup
- [ ] **1.1** Initialize standalone Angular 17+ application (`ng new nexora --standalone`)
- [ ] **1.2** Establish directory structure: `src/app/{core, features, layout, shared}`
- [ ] **1.3** Implement CSS design tokens in `src/styles.css` (NEXORA cyberpunk/indie palette: void backgrounds, electric violet/cyan/emerald accents, spacing scale, typography, border radii)
- [ ] **1.4** Create TypeScript data models in `core/models/`:
  - `user.model.ts` (id, email, displayName, roles `('buyer' | 'creator')[]`, createdAt)
  - `game.model.ts` (id, title, description, price, tags, coverImageUrl, screenshotUrls, samplePackageUrl, ownerId, createdAt, updatedAt, deletedAt) — `updatedAt` is required: `GamesDataService.updateGame()` refreshes it on every edit, see [API Services Reference](docs/reference-api-services.md#gamesdataservice)
  - `library-entry.model.ts` (id, userId, gameId, acquiredAt, orderId)
  - `order.model.ts` (id, userId, gameId, price, status, createdAt) — `price` snapshots `Game.price` at purchase time; see [Data Models Reference](docs/reference-data-models.md#order)
  - `wishlist-entry.model.ts` (id, userId, gameId, addedAt) — see [Data Models Reference](docs/reference-data-models.md#wishlistentry)
- [ ] **1.5** Implement `LocalStoreService` (`core/persistence/local-store.service.ts`) with IndexedDB / localStorage fallback
- [ ] **1.6** Define DI injection tokens in `core/data/tokens.ts` (`GAMES_DATA`, `LIBRARY_DATA`, `USERS_DATA`, `ORDERS_DATA`, `WISHLIST_DATA`) — Wishlist gets a real token now rather than a bare `LocalStoreService` call, so it follows the same DI pattern as every other data-backed feature

---

### Task 2: Authentication, Guards & Mock Data Seeding
- [ ] **2.1** Implement `AuthService` (`core/auth/auth.service.ts`) with Angular Signals (`currentUser`, `isAuthenticated`, `isCreator`)
- [ ] **2.2** Implement `AuthMockService` (`core/auth/auth.mock.ts`) with credential verification and 1-click social sign-in simulation
- [ ] **2.3** Implement `authGuard` (`core/auth/auth.guard.ts`) with `returnUrl` query parameter preservation
- [ ] **2.4** Implement `roleGuard` (`core/auth/role.guard.ts`) checking `roles.includes('creator')` with `/catalog` redirect
- [ ] **2.5** Build `LoginComponent` (`features/auth/login/`) with email/password form (e.g. `welcome@nexora.io`), demo account pills (Alice `alice@nexora.io`, Bob `bob@nexora.io`, Carol `carol@nexora.io`), forgot password link, and inline SVG Google & Apple buttons
- [ ] **2.6** Build `RegisterComponent` (`features/auth/register/`) with "I want to publish games" creator role toggle
- [ ] **2.7** Build `ForgotPasswordComponent` (`features/auth/forgot-password/`) with email input, simulated reset confirmation message, and back-to-login navigation
- [ ] **2.8** Create mock database seeder (`seed-games.json` / `MockGamesDataService`): modular schema seeded with NEXORA cyberpunk/synthwave/retro indie games, ready to swap with live HTTP APIs
- [ ] **2.9** Populate sample game packages in `src/assets/sample-packages/` (placeholders ready for team assets)

---

## Phase 2: Public Features (Tasks 3–4)

### Task 3: Game Catalog & Search/Filter Interface
- [ ] **3.1** Implement `GamesDataService` interface and `MockGamesDataService` (`core/data/games/`)
- [ ] **3.2** Build `GameCardComponent` (`shared/ui/game-card/`) showing cover image, title, price badge, and wishlist heart toggle
- [ ] **3.3** Build `LoadingSpinnerComponent` (`shared/ui/loading-spinner/`) with size variants (`sm`, `md`)
- [ ] **3.4** Build `EmptyStateComponent` (`shared/ui/empty-state/`) with custom message, icon, and action button
- [ ] **3.5** Build `GameCatalogComponent` (`features/game-catalog/`) with:
  - Responsive CSS Grid (1 col on mobile, multi-col on desktop)
  - Substring search input
  - Dynamic horizontal tag filter chips
- [ ] **3.6** Build `GenreDirectoryComponent` (`features/genres/`) with category cards, game counts, and routing to `/catalog?tag=...`

---

### Task 4: Game Detail Page & Application Shell
- [ ] **4.1** Implement `UsersDataService` and `MockUsersDataService` (`core/data/users/`) to resolve creator names
- [ ] **4.2** Build `HeaderComponent` (`layout/header/`) with:
  - Logo & site branding
  - Responsive navigation links adapted to auth state (Anonymous vs Buyer vs Creator)
  - Active user display with `RoleBadgeComponent` & Logout CTA
  - Mobile hamburger navigation toggle
- [ ] **4.3** Build `FooterComponent` (`layout/footer/`) with copyright and version info
- [ ] **4.4** Build `GameDetailComponent` (`features/game-detail/`) with hero cover image, 2-column layout (metadata + actions), creator link, and horizontal screenshot scroll row
- [ ] **4.5** Build `CreatorProfileComponent` (`features/creator-profile/`) displaying creator bio, avatar, role badge, and published game list
- [ ] **4.6** Build `NotFoundComponent` (`features/not-found/`) for 404 error page and `**` wildcard route fallback
- [ ] **4.7** Build `SupportComponent` (`features/support/`) with FAQ accordion, reactive contact form, simulated ticket submission banner, and Privacy & Data Trust Notice card (`#privacy`)
- [ ] **4.8** Configure top-level routing in `app.routes.ts`

---

## Phase 3: Gated Features (Tasks 5–7)

### Task 5: 5-State Download Button & Purchase Flow
- [ ] **5.1** Build `DownloadButtonComponent` (`shared/ui/download-button/`) supporting the 5 states:
  - `Anonymous`: "Download" $\rightarrow$ redirects to `/login?returnUrl=...`
  - `Free + Unowned`: "Download Free" $\rightarrow$ adds to library & downloads
  - `Paid + Unowned`: "Buy $X.XX" $\rightarrow$ triggers purchase modal $\rightarrow$ on confirm: creates order, adds to library & immediately initiates file download
  - `Owned`: "Download" $\rightarrow$ direct file download
  - `Unavailable`: "Unavailable" $\rightarrow$ disabled state for soft-deleted games
- [ ] **5.2** Build `PurchaseConfirmModalComponent` (`shared/ui/purchase-confirm-modal/`) showing game title, price, and Confirm/Cancel CTAs
- [ ] **5.3** Implement `OrdersDataService` and `MockOrdersDataService` (`core/data/orders/`)
- [ ] **5.4** Integrate download button and purchase modal into `GameDetailComponent` with automatic fulfillment and immediate file download

---

### Task 6: My Library, Wishlist & Gated Download Integration
- [ ] **6.1** Implement `LibraryDataService` and `MockLibraryDataService` (`core/data/library/`)
- [ ] **6.2** Build `LibraryComponent` (`features/library/`) showing list of owned games with thumbnail, acquired date, and download button
- [ ] **6.3** Implement `WishlistDataService` and `MockWishlistDataService` (`core/data/wishlist/`) — `getWishlist(userId)`, `addToWishlist(userId, gameId)`, `removeFromWishlist(userId, gameId)`, same in-memory + `LocalStoreService` persistence pattern as the other mock services
- [ ] **6.4** Build `WishlistComponent` (`features/wishlist/`) injecting `WISHLIST_DATA` (not `LocalStoreService` directly) — bookmarked games grid with heart removal; clicking a card navigates to `/games/:id`, where the normal download button handles acquisition (there is no separate in-card "quick acquisition" action — no component contract supports one)
- [ ] **6.5** Build `OrdersComponent` (`features/orders/`) showing completed purchases with Order ID, game title, price, date, and receipt link
- [ ] **6.6** Build `ProfileComponent` (`features/profile/`) showing user info, role badges, creator mode toggle, and demo database reset button
- [ ] **6.7** Wire the complete gated download lifecycle:
  - Anonymous user click $\rightarrow$ `/login` with `returnUrl` $\rightarrow$ Auth completion $\rightarrow$ Return to game detail $\rightarrow$ Free/Paid acquisition $\rightarrow$ LibraryEntry creation $\rightarrow$ Trigger browser download $\rightarrow$ Game visible in `/library`

---

### Task 7: System Integration, Layout & Bug Fixes
- [ ] **7.1** Test end-to-end flows across all user personas (Anonymous, Buyer, Creator)
- [ ] **7.2** Audit responsive breakpoints (<768px mobile vs $\ge$768px desktop) across all pages
- [ ] **7.3** Validate session switching: logging out as Buyer and logging in as Creator immediately reflects updated library and creator links

---

## Phase 4: Hardening, Creator Studio & Final Polish (Tasks 8–10)

### Task 8: Error Handling & Edge Cases
- [ ] **8.1** Add `?simulateErrors=true` URL query parameter support for network failure testing
- [ ] **8.2** Verify `returnUrl` edge cases (e.g. buyer attempting to access `/studio` via returnUrl is redirected by `roleGuard` to `/catalog`)
- [ ] **8.3** Verify soft-delete behavior across both Catalog (hidden) and Library (marked "Unavailable")

---

### Task 9: Creator Studio & Game Publishing (Committed — Minimal Scope, Required for CRUD)
> The Problem Statement names CRUD as a graded competency, and Creator Studio is the only CRUD surface in the app — this is no longer optional. Scope is deliberately minimal (plain `<table>`, no listing-table polish) so it doesn't crowd out download-flow polish time. Target: complete by Day 7–8. If time is short, Create + soft-Delete alone (dropping Edit) still demonstrates two-thirds of CRUD plus the ownership guard.
- [ ] **9.1** Implement `ownershipGuard` (`core/auth/ownership.guard.ts`)
- [ ] **9.2** Build `TagChipInputComponent` (`shared/ui/tag-chip-input/`) with interactive add/remove & tag validation (1–5 tags, 2–20 chars)
- [ ] **9.3** Build `CreatorStudioComponent` (`features/creator-studio/`) with listings table and soft-delete modal
- [ ] **9.4** Build `GameFormComponent` (`features/creator-studio/game-form/`) supporting both Create and Edit modes with full reactive form validation
- [ ] **9.5** Register routes in `app.routes.ts` per the [route table](docs/reference-routes-guards.md#route-table):
  - `/studio` and `/studio/games/new` → `[authGuard, roleGuard('creator')]` only (no `ownershipGuard` — there's no existing game record to check ownership against on the create route)
  - `/studio/games/:id/edit` → `[authGuard, roleGuard('creator'), ownershipGuard]`

---

### Task 10: Final Polish, Automated Unit Tests & Demo Preparation
- [ ] **10.1** Write unit tests for `DownloadButtonComponent` 5-state transitions and Guard logic
- [ ] **10.2** Final UI polish (consistent typography, button hover micro-interactions, responsive padding)
- [ ] **10.3** Prepare presentation and live demo script for capstone grading panel

---

<!--
## Phase 5: Post-Capstone Extensions (Tasks 11–12) [OPTIONAL]

### Task 11: Real Backend HTTP Adapters (Future Extension)
- [ ] **11.1** Implement `HttpGamesDataService`, `HttpLibraryDataService`, `HttpOrdersDataService`, `HttpUsersDataService` using Angular `HttpClient`
- [ ] **11.2** Swap providers in `app.config.ts` to connect to live REST API with zero UI component changes

---

### Task 12: Automated Playwright E2E Test Suite (Future Extension)
- [ ] **12.1** Set up Playwright test runner and environment configuration
- [ ] **12.2** Implement automated end-to-end browser test journeys covering the full gated download sequence
-->

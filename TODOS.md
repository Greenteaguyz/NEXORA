# NEXORA — Project implementation tasks and deliverables

This document tracks all engineering milestones and implementation tasks for the **NEXORA** cyberpunk and indie game marketplace capstone project.

### Phase status summary

| Phase | Scope | Status | Verification |
| :--- | :--- | :--- | :--- |
| **Phase 1** (Tasks 1–2) | Project scaffold, auth, guards, mock data | ✅ Complete | 15/15 unit & guard tests passed |
| **Phase 2** (Tasks 3–4) | Catalog, search, game detail, creator profile, theming, support, header with RoleBadge & mobile hamburger | ✅ Complete | 20/20 domain integration tests, dual-theme visual audit verified |
| **Phase 3** (Tasks 5–7) | Download button, purchase flow, library/wishlist/orders/profile views | ✅ Complete | 5-state download button active, purchase modal & instant package fulfillment verified across personas |
| **Phase 4** (Tasks 8–10) | Error handling, Creator Studio, polish & tests | ✅ Complete | Full CRUD listings table, TagChipInput, `ownershipGuard` & `roleGuard` routing, soft-delete lifecycle verified |
| **Phase 5** (Quality & Audits) | Mobile deep audit, WCAG accessibility, XSS fuzzing, redirects | ✅ Complete | 253 automated checks passing (100% pass rate), 0 layout overflows, Cloudflare tunnel live |
| **Phase 9** (Task 14) | Impeccable Anti-Slop Elimination, Steam DesignMD Tokens & Unified CI Gate | ✅ Complete | 54/54 tests passing across 4 suites, 0 neon glows, 2.32s production build |
| **Phase 10** (Task 15) | Omni-Resolution Fluid Architecture, Fixed 16:9 Standard, Zero-Shift Media | ✅ Complete | 166/166 tests passing, 0.00px CLS, 4-slide hero parity |
| **Phase 11** (Task 16) | Speedtest Dual-Segment Switcher, Unified Steam Deck Hub Mobile Navigation & Crawler | ✅ Complete | 223/223 tests passing, 24/24 crawler links valid, 5/5 Playwright E2E passed |
| **Phase 12** (Task 17) | Hero Carousel Touch Drag-to-Swipe, Hardware-Accelerated Motion & Clean Pagination | ✅ Complete | 234/234 tests passing, 142 unit tests across 27 sections, 100% green |
| **Phase 13** (Task 18) | Smart Scroll-Aware Header, Mobile Viewport Clearance & Bottom Bar UX | ✅ Complete | 243/243 tests passing, 151 unit tests across 28 sections, 100% green |
| **Phase 14** (Task 19) | Payment & Wallet Architecture, Cambodian KHQR Bakong, Card DTOs & Checkout Modal | ✅ Complete | Full mock ledger, 4 KHQR banks, credit card validation, 550 total tests |
| **Phase 15** (Task 20) | Ref-Counted Scroll Lock Engine & Directive for 15 Fullscreen Overlays | ✅ Complete | Multi-overlay ref-count, iOS fixed-body compensation, scrollbar width balancing |
| **Phase 16** (Task 21) | Resilient Toast Notification Queue, Severity Tiers, Exit Transitions & Hover-Pause | ✅ Complete | 4 severity tiers, 180ms CSS exit transition, deduplication, stack cap 3, undo payload |
| **Phase 17** (Task 22) | Deep Link Intent Engine, Return URL Sanitization & Dynamic Route Titles | ✅ Complete | `?intent=purchase|download`, `sanitizeReturnUrl` against open redirects, `?reason=` alerts |
| **Phase 18** (Task 23) | Creator Studio Unsaved Changes CanDeactivate Guard & Dirty Detection | ✅ Complete | Safe form navigation guard, `justSaved` bypass, buyer-impact unpublish dialog |
| **Phase 19** (Task 24) | Storefront Card UX, Owned Badges, Formatting Directives & Profile Cleanup | ✅ Complete | `Owned` badge on catalog cards, `appCardNumber` / `appCvv` / `appExpiryDate`, live wallet stat |
| **Deployment and Ops** | Cloud hosting, tunnels, caching headers & performance budgets | ✅ Ready | `vercel.json` caching headers (1y immutable assets), 550 tests passing (100% green) |

---

## Phase 12: Hero Carousel Touch Drag-to-Swipe, Hardware-Accelerated Motion & Clean Pagination (Task 17)

### Task 17: Hero Carousel Gestures, Swipe Physics & Smooth Motion Engine
- [x] **17.1** Hardware-Accelerated Crossfade Physics: Implemented `@keyframes heroMediaFadeIn` with dual-phase opacity crossfade (`0.82 -> 1.0`) and subtle scale settle (`scale(1.012) -> scale(1.0)`) over `0.35s cubic-bezier(0.16, 1, 0.3, 1)` with `will-change: opacity, transform`.
- [x] **17.2** Coordinated Info Capsule Reveal: Implemented `@keyframes capsuleInfoReveal` (`translateY(4px) -> translateY(0)`) over `0.28s cubic-bezier(0.16, 1, 0.3, 1)` for synchronized title, tags, and preview reveals.
- [x] **17.3** Full-Capsule Touch & Pointer Drag-to-Swipe: Built native Pointer/Touch event listeners on `.steam-carousel-capsule` with `40px` horizontal threshold, directional angle lock (`Math.abs(deltaX) > Math.abs(deltaY)`), and `touch-action: pan-y;` to preserve vertical page scrolling.
- [x] **17.4** Tap-vs-Drag Disambiguation Engine: Clean tap/click detection (`< 6px`) allows instant router navigation to `/games/:id` while deliberate drags (`> 6px`) cleanly suppress click navigation.
- [x] **17.5** Minimalist Centered Pill Indicators: Removed redundant `<` and `>` arrow buttons, elevated pagination track into a frosted glass dock with fluid pill expansion (`24px -> 38px`) and Electric Cyan luminous indicator.
- [x] **17.6** Spatial Keyboard Traversal: Added `@HostListener('window:keydown')` for `ArrowLeft` and `ArrowRight` slide navigation with search input focus protection.
- [x] **17.7** Image Cache Warmer: Implemented proactive pre-caching of adjacent hero screenshot URLs (`new Image().src = ...`) for zero-lag instant transitions.
- [x] **17.8** Automated Unit & Regression Expansion: Added Section 27 to `unit-tests.spec.ts` (142 unit tests), expanded total verified test assertions to 234 (100% green pass rate across all suites).

---

## Phase 13: Smart Scroll-Aware Header, Mobile Viewport Clearance & Bottom Navigation UX (Task 18)

### Task 18: Smart Scroll Header & Mobile Ergonomics
- [x] **18.1** Smart Scroll-Aware Header: Implemented `@HostListener('window:scroll')` with passive delta calculation to smoothly slide header out on downward scroll (`transform: translateY(-100%)`) over `0.25s cubic-bezier(0.16, 1, 0.3, 1)`, re-revealing on upward scroll or top-of-page (`scrollY <= 10px`).
- [x] **18.2** Navigation Drawer Immunity: Header dismissal is strictly locked off whenever the mobile navigation drawer or search command palette is active.
- [x] **18.3** Footer Legal Content Collision Remediation: Added `padding-bottom: calc(var(--space-8) + 64px + env(safe-area-inset-bottom, 0px))` on viewports $\le 768px$, guaranteeing 100% unclipped visibility for copyright and policy links.
- [x] **18.4** Mobile Bottom Bar Safe-Area Ergonomics: Replaced fixed height with dynamic `min-height: 56px; padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px))` and frosted glass elevation (`backdrop-filter: blur(20px) saturate(180%)`).
- [x] **18.5** Luminous Active Indicator & Touch Feedback: Upgraded active tab to an Electric Cyan (`#66C0F4`) centered pill indicator with instant `scale(0.95)` press feedback and `touch-action: manipulation`.
- [x] **18.6** Automated Regression Expansion: Added Section 28 to `unit-tests.spec.ts` (151 unit tests), expanding total verified test assertions to 243 (100% green pass rate across all suites).

---

## Phase 14: Payment & Wallet Architecture, Cambodian KHQR Bakong & Checkout Modal (Task 19)

### Task 19: Payments & Wallet Architecture
- [x] **19.1** Payment Domain Models & DI Tokens: Implemented `payment.model.ts` (`PaymentMethod`, `CardPaymentMethod`, `KhqrPaymentMethod`, `Wallet`, `WalletTransaction`, `GiftCard`) and registered `PAYMENTS_DATA` injection token.
- [x] **19.2** Mock Payment Data Service: Built `MockPaymentsDataService` with local storage persistence, method creation/deletion/default toggles, wallet balance mutation, and immutable transaction ledgering.
- [x] **19.3** Dedicated Payment & Wallet Feature Page: Built `AccountPaymentComponent` (`/account/payment`) featuring Credit Card cards, Cambodian KHQR Bakong cards (ABA, ACLEDA, Wing, Bakong), wallet balance top-up modal, and prepaid gift code redemption.
- [x] **19.4** Integrated Checkout Modal: Upgraded `PurchaseConfirmModalComponent` to query `PAYMENTS_DATA`, supporting direct wallet balance deduction or default card selection with fallback prompts.
- [x] **19.5** Shared Payment Brand Mark & KHQR Components: Created `PaymentBrandMarkComponent` and `KhqrCardComponent` with authentic vector brand badges and QR preview containers.

---

## Phase 15: Ref-Counted Scroll Lock Engine for Fullscreen Overlays (Task 20)

### Task 20: Scroll Locking Architecture
- [x] **20.1** Atomic Ref-Counting Service: Implemented `ScrollLockService` maintaining an internal `lockCount` to safely manage multiple concurrently open dialogs and drawers.
- [x] **20.2** iOS Fixed-Body Neutralization: Used `position: fixed; width: 100%; top: -${scrollY}px;` on body to prevent iOS Safari rubber-band background scrolling while preserving exact scroll position on restore.
- [x] **20.3** Gutter Shift Compensation: Added dynamic desktop scrollbar width measurement and padding compensation to prevent layout reflows when scrollbars disappear.
- [x] **20.4** Declarative Directive Integration: Built `[appScrollLock]` directive and attached it to 15 fullscreen overlay surfaces across the application.

---

## Phase 16: Resilient Toast Notification Queue & Lifecycle Engine (Task 21)

### Task 21: Toast Queue & Lifecycle Architecture
- [x] **21.1** Multi-Tier Severity System: Configured auto-dismiss timers by severity (`success`: 3.5s, `info`/`download`: 4s, `warning`: 5s, `error`: 7s).
- [x] **21.2** Leaving State & Exit Animations: Introduced `leaving: true` flag enabling 180ms CSS fade-out before array eviction to eliminate abrupt visual pop-out.
- [x] **21.3** Stack Capacity & Queue Deduplication: Implemented cap of 3 visible toasts with oldest-item eviction and identical message deduplication with timer reset.
- [x] **21.4** Interactive Hover-Pause & Double-Fire Guarded Undo: Added `pause(id)` and `resume(id)` on hover/focus, and optional `action` payload supporting undo callbacks with execution locks.

---

## Phase 17: Deep Link Intent Engine, URL Synchronizer & Route Metadata (Task 22)

### Task 22: Deep Link Intents & Route Polish
- [x] **22.1** Intent Deep Linking: Added `?intent=purchase` and `?intent=download` on `/games/:id` with auto-triggering on load and silent URL parameter stripping via `replaceUrl: true`.
- [x] **22.2** Return URL Sanitization: Implemented `sanitizeReturnUrl` protecting against `//`, schemes, and backslashes with automatic fallback to `/catalog`.
- [x] **22.3** Guard Rejection Feedback: Root `AppComponent` translates `?reason=` codes (`auth-required`, `creator-required`, `not-owner`, `game-not-found`) into user-facing toast notifications.
- [x] **22.4** Dynamic Titles & Meta Tags: Configured dynamic document title updates across all 18 routes and OpenGraph metadata per game detail.

---

## Phase 18: Creator Studio Unsaved Changes CanDeactivate Guard (Task 23)

### Task 23: Unsaved Changes Guard & Studio Polish
- [x] **23.1** CanDeactivate Form Guard: Built `unsavedChangesGuard` attached to `/studio/games/new` and `/studio/games/:id/edit`.
- [x] **23.2** Dirty State Detection & Save Bypass: Implemented `hasUnsavedChanges()` with `markAsPristine()` and `justSaved` state machine flag to guarantee seamless post-save navigation.
- [x] **23.3** Buyer-Impact Unpublish Dialog: Added contextual warnings in soft-delete unpublish modal reminding creators that existing owners retain library access.
- [x] **23.4** Mobile Input Ergonomics: Enforced 16px font floor on mobile inputs to prevent iOS automatic zoom.

---

## Phase 19: Storefront Card UX, Owned Badges & Profile Cleanup (Task 24)

### Task 24: Card UX & Profile Dashboard Refinements
- [x] **24.1** Real-Time Owned Badges: Updated catalog `GameCardComponent` to query `LIBRARY_DATA.isOwned`, displaying an Emerald `Owned` badge for acquired games.
- [x] **24.2** Caret-Safe Payment Directives: Built `CardNumberDirective` (4-digit grouping), `CvvDirective` (numeric cap 4), and `ExpiryDateDirective` (MM/YY auto-slash).
- [x] **24.3** Mis-Click Prevention: Removed whole-card click dismissal on toasts, restricting closure to 44px close target or auto-expiry with 250ms spawn grace.
- [x] **24.4** Profile Dashboard Cleanup: Removed demo "System Reset" bar and avatar glow ring, and wired live `formatUsd(balance)` wallet stat card.
- [x] **24.5** Test Battery Expansion to 550 Tests: Expanded test coverage to 469 unit tests (across 87 sections), 51 integration tests, 23 master battery tests, and 7 impeccable tests (100% green).

## Agent execution and quality workflow

Standard skills applied during development:

### During task execution (active monitoring and guardrails)
- [x] **TDD and regression coverage**: Follow `tdd-workflow` (write tests first) and `ai-regression-testing` (catch AI blindspots).
- [x] **Safety and scoping**: Use `careful` / `guard` / `freeze` to safeguard against destructive commands and scope file edits.
- [x] **Write-time code quality**: Apply `plankton-code-quality` for auto-formatting, linting, and write-time fixes.
- [x] **Context budgeting**: Use `strategic-compact` at logical milestones to maintain optimal token efficiency.
- [x] **Real-time learning and memory**: Leverage `continuous-learning-v2` (instinct capture) and `ck` (persistent project context).
- [x] **Rule enforcement**: Ensure compliance with configured `hookify-rules`.

### After task execution (verification, QA, and review)
- [x] **Delivery gate**: Enforce `delivery-gate` to verify that all quality checks pass before completing a task.
- [x] **Verification loop**: Execute `verification-loop` to validate behavior, compilation, and test correctness.
- [x] **Self-evaluation**: Run `agent-self-evaluation` to score output across accuracy, completeness, clarity, actionability, and conciseness (1–5 scale).
- [x] **Growth and learning capture**: Record reusable patterns with `growth-log` and manage learnings with `learn`.
- [x] **Visual and functional QA**: Use `browse` / `browser-qa` / `qa-only` for UI and interactive feature validation.
- [x] **Code review and auditing**: Run `review` for diff inspections, `production-audit` for readiness checks, and `canary` / `retro` for post-deploy monitoring and metrics.

---

## Phase 1: Foundation (Tasks 1–2)

### Task 1: Project scaffold and core layer setup
- [x] **1.1** Initialize standalone Angular 18+ application (`ng new nexora --standalone`)
- [x] **1.2** Establish directory structure: `src/app/{core, features, layout, shared}`
- [x] **1.3** Implement CSS design tokens in `src/styles.css` (NEXORA cyberpunk/indie palette: void backgrounds, electric violet/cyan/emerald accents, spacing scale, typography, border radii)
- [x] **1.4** Create TypeScript data models in `core/models/`:
  - `user.model.ts` (id, email, displayName, roles `('buyer' | 'creator')[]`, createdAt)
  - `game.model.ts` (id, title, description, price, tags, coverImageUrl, screenshotUrls, samplePackageUrl, ownerId, createdAt, updatedAt, deletedAt)
  - `library-entry.model.ts` (id, userId, gameId, acquiredAt, orderId)
  - `order.model.ts` (id, userId, gameId, price, status, createdAt)
  - `wishlist-entry.model.ts` (id, userId, gameId, addedAt)
- [x] **1.5** Implement `LocalStoreService` (`core/persistence/local-store.service.ts`) with IndexedDB / localStorage fallback
- [x] **1.6** Define DI injection tokens in `core/data/tokens.ts` (`GAMES_DATA`, `LIBRARY_DATA`, `USERS_DATA`, `ORDERS_DATA`, `WISHLIST_DATA`)

---

### Task 2: Authentication, guards, and mock data seeding
- [x] **2.1** Implement `AuthService` (`core/auth/auth.service.ts`) with Angular Signals (`currentUser`, `isAuthenticated`, `isCreator`, `isBuyer`)
- [x] **2.2** Implement `AuthMockService` (`core/auth/auth.mock.ts`) with credential verification and 1-click social sign-in simulation
- [x] **2.3** Implement `authGuard` (`core/auth/auth.guard.ts`) with `returnUrl` query parameter preservation
- [x] **2.4** Implement `roleGuard` (`core/auth/role.guard.ts`) checking `roles.includes('creator')` with `/catalog` redirect
- [x] **2.5** Build `LoginComponent` (`features/auth/login/`) with email/password form, demo account pills (Alice, Bob, Carol), forgot password link, and inline SVG Google and Apple buttons
- [x] **2.6** Build `RegisterComponent` (`features/auth/register/`) with creator role toggle
- [x] **2.7** Build `ForgotPasswordComponent` (`features/auth/forgot-password/`) with email input, simulated reset confirmation message, and back-to-login navigation
- [x] **2.8** Create mock database seeder (`seed-data.ts` / `MockGamesDataService`)
- [x] **2.9** Populate sample game packages in `src/assets/sample-packages/`

---

## Phase 2: Public features (Tasks 3–4)

### Task 3: Game catalog and search/filter interface
- [x] **3.1** Implement `GamesDataService` interface and `MockGamesDataService` (`core/data/games/`)
- [x] **3.2** Build `GameCardComponent` (`shared/ui/game-card/`) showing cover image, title, price badge, and wishlist heart toggle
- [x] **3.3** Build `LoadingSpinnerComponent` (`shared/ui/loading-spinner/`) with size variants (`sm`, `md`, `lg`)
- [x] **3.4** Build `EmptyStateComponent` (`shared/ui/empty-state/`) with custom message, icon, and action button
- [x] **3.5** Build `GameCatalogComponent` (`features/game-catalog/`) with responsive CSS Grid, substring search input, and dynamic horizontal tag filter chips
- [x] **3.6** Build `GenreDirectoryComponent` (`features/genres/`) with category cards, game counts, and routing to `/catalog?tag=...`

---

### Task 4: Game detail page and application shell
- [x] **4.1** Implement `UsersDataService` and `MockUsersDataService` (`core/data/users/`) to resolve creator names
- [x] **4.2** Build `HeaderComponent` (`layout/header/`) with logo branding, responsive navigation links, `RoleBadgeComponent`, and mobile hamburger navigation drawer
- [x] **4.3** Build `FooterComponent` (`layout/footer/`) with copyright and version info
- [x] **4.4** Build `GameDetailComponent` (`features/game-detail/`) with hero cover image, 2-column layout, creator link, horizontal screenshot scroll row, and full-screen lightbox modal
- [x] **4.5** Build `CreatorProfileComponent` (`features/creator-profile/`) displaying creator bio, avatar, and published game list
- [x] **4.6** Build `NotFoundComponent` (`features/not-found/`) for 404 error page and `**` wildcard route fallback
- [x] **4.7** Build `SupportComponent` (`features/support/`) with FAQ accordion, reactive contact form, ticket submission banner, and Privacy & Data Trust card (`#privacy`)
- [x] **4.8** Configure top-level routing in `app.routes.ts`
- [x] **4.9** Implement `ThemeService` and dynamic **Light/Dark Mode** theme toggle in header with CSS custom properties and `localStorage` persistence

---

## Phase 3: Gated features (Tasks 5–7)

### Task 5: 5-state download button and purchase flow
- [x] **5.1** Build `DownloadButtonComponent` (`shared/ui/download-button/`) supporting the 5 states:
  - `Anonymous`: "Download" $\rightarrow$ redirects to `/login?returnUrl=...`
  - `Free + Unowned`: "Download Free" $\rightarrow$ adds to library and downloads
  - `Paid + Unowned`: "Buy $X.XX" $\rightarrow$ triggers purchase modal $\rightarrow$ on confirm: creates order, adds to library, and initiates file download
  - `Owned`: "Download" $\rightarrow$ direct file download
  - `Unavailable`: "Unavailable" $\rightarrow$ disabled state for soft-deleted games
- [x] **5.2** Build `PurchaseConfirmModalComponent` (`shared/ui/purchase-confirm-modal/`) showing game title, price, and Confirm/Cancel CTAs
- [x] **5.3** Implement `OrdersDataService` and `MockOrdersDataService` (`core/data/orders/`) with `LocalStoreService` persistence and DI token registration
- [x] **5.4** Integrate download button and purchase modal into `GameDetailComponent` with automatic fulfillment and immediate file download

---

### Task 6: My Library, Wishlist, and gated download integration
- [x] **6.1** Implement `LibraryDataService` and `MockLibraryDataService` (`core/data/library/`) with `LocalStoreService` persistence and DI token registration
- [x] **6.2** Build `LibraryComponent` (`features/library/`) showing list of owned games with thumbnail, acquired date, and download button
- [x] **6.3** Implement `WishlistDataService` and `MockWishlistDataService` (`core/data/wishlist/`) with `LocalStoreService` persistence and DI token registration
- [x] **6.4** Build `WishlistComponent` (`features/wishlist/`) injecting `WISHLIST_DATA`
- [x] **6.5** Build `OrdersComponent` (`features/orders/`) showing completed purchases with Order ID, game title, price, date, and digital receipt modal
- [x] **6.6** Build `ProfileComponent` (`features/profile/`) showing user info, role badges, creator mode toggle, and demo database reset button
- [x] **6.7** Wire the complete gated download lifecycle: Anonymous click $\rightarrow$ `/login` with `returnUrl` $\rightarrow$ Auth completion $\rightarrow$ Return to game detail $\rightarrow$ Free/Paid acquisition $\rightarrow$ LibraryEntry creation $\rightarrow$ Trigger browser download $\rightarrow$ Game visible in `/library`

---

### Task 7: System integration, layout, and bug fixes
- [x] **7.1** Test end-to-end flows across all user personas (Anonymous, Buyer, Creator)
- [x] **7.2** Audit responsive breakpoints (<768px mobile vs $\ge$768px desktop) across all pages
- [x] **7.3** Validate session switching: logging out as Buyer and logging in as Creator immediately reflects updated library and creator links

---

## Phase 4: Hardening, Creator Studio, and final polish (Tasks 8–10)

### Task 8: Error handling and edge cases
- [x] **8.1** Add `?simulateErrors=true` URL query parameter support for network failure testing
- [x] **8.2** Verify `returnUrl` edge cases (for example, buyer attempting to access `/studio` via returnUrl is redirected by `roleGuard` to `/catalog`)
- [x] **8.3** Verify soft-delete behavior across both Catalog (hidden) and Library (marked "Unavailable")

---

### Task 9: Creator Studio and game publishing
- [x] **9.1** Implement `ownershipGuard` (`core/auth/ownership.guard.ts`)
- [x] **9.2** Build `TagChipInputComponent` (`shared/ui/tag-chip-input/`) with interactive add/remove and tag validation (1–5 tags, 2–20 chars)
- [x] **9.3** Build `CreatorStudioComponent` (`features/creator-studio/`) with listings table and soft-delete modal
- [x] **9.4** Build `GameFormComponent` (`features/creator-studio/game-form/`) supporting both Create and Edit modes with full reactive form validation
- [x] **9.5** Register routes in `app.routes.ts`:
  - `/studio` and `/studio/games/new` $\rightarrow$ `[authGuard, roleGuard('creator')]`
  - `/studio/games/:id/edit` $\rightarrow$ `[authGuard, roleGuard('creator'), ownershipGuard]`

---

### Task 10: Final polish, automated test battery, and public preview
- [x] **10.1** Write unit and integration tests for `DownloadButtonComponent` 5-state transitions and Guard logic
- [x] **10.2** Final UI polish (consistent typography, button hover micro-interactions, responsive padding)
- [x] **10.3** Execute full automated deep testing battery (253 total checks passing)
- [x] **10.4** Launch Cloudflare public tunnel for live mobile and external validation

---

## Phase 6: UX Streamlining, Hero Shooter Data, & Light Mode Polish (Task 11)

### Task 11: UX Optimization, Hero Data, and Responsive Polish
- [x] **11.1** Optimize Genres Directory (`/genres`) with live search bar, clear action, and clean auto-fill grid layout
- [x] **11.2** Streamline Game Details acquisition banner into clean 2-tier layout with direct action controls and trust spec strip
- [x] **11.3** Update platform builds to **Windows 32/64-bit** and **Linux x86_64** (removed Steam Deck option)
- [x] **11.4** Replace `game_001` with real *Marvel Rivals* title, third-person superhero action description, and accurate genre taxonomy (`Action`, `Hero Shooter`, `Third-Person`, `Sci-Fi`, `Tactics`, `PvP`)
- [x] **11.5** Bundle official high-res Marvel Rivals cover art, wide hero banner, environment background, and showcase screenshots in `src/assets/images/`
- [x] **11.6** Enhance Light Mode full-screen screenshot lightbox with frosted soft slate gray backdrop blur (`rgba(15, 23, 42, 0.75)`)
- [x] **11.7** Implement pixel-perfect vector SVG animated hamburger menu button for mobile navigation
- [x] **11.8** Execute regression test suite (100% pass) and production build validation

---

## Phase 7: Mobile Gestures, Profile Minimalism, Fluid Architecture, & Production Verification (Task 12)

### Task 12: Advanced UI/UX, CRUD Workflows, and Edge-to-Edge Responsiveness
- [x] **12.1** Implement App Store / Steam mobile gallery gestures with horizontal touch swipe detection (`onTouchStart`, `onTouchEnd`, delta > 35px), floating `1 / 4` slide counter pill, and synchronized thumbnails
- [x] **12.2** Streamline demo personas to 2 distinct accounts (`Alice (Creator)` and `Bob (Buyer)`) across desktop navbar, mobile drawer, and `/login`
- [x] **12.3** Refine Creator Profile (`/creators/:id`) with ambient studio key art banner, `[showCreator]="false"` on game cards to eliminate redundancy, and 1-click clipboard profile sharing
- [x] **12.4** Rebuild User Profile (`/profile`) into a clean, minimal 1-screen hub with 3 interactive stat cards (`/library`, `/wishlist`, `/orders`), single role badge, and streamlined Creator Studio action bar
- [x] **12.5** Enhance Creator Studio Game Form (`/studio/new`, `/studio/edit/:id`) with full CRUD tag management (`+ Add` button, live tag counter, chip suggestions, remove buttons) and live 16:9 cover artwork preview
- [x] **12.6** Upgrade layout engine to 100% fluid edge-to-edge system (`clamp(16px, 3.5vw, 56px)`) with dynamic `repeat(auto-fill, minmax(280px, 1fr))` grid to handle ultra-wide / 4K monitors and browser zoom-out gracefully
- [x] **12.7** Convert layout to flexbox sticky-footer architecture, removing artificial `80vh` heights and ensuring the footer remains naturally visible without empty vertical voids
- [x] **12.8** Complete `/test-coverage`, `/verification-loop`, `/delivery-gate`, and `/living-docs-governance` protocols with 100% pass rate (50/50 tests passing, 0 type errors, clean production bundle)

---

## Phase 8: Library Management, Official Invoicing, & Commerce Hardening (Task 13)

### Task 13: Library CRUD, Executive Invoice Printing, & Commerce Optimization
- [x] **13.1** Implement 1-click **"Add to Library"** (Claim) and **"Remove from Library"** in `GameDetailComponent` for Free games without forcing instant large file downloads
- [x] **13.2** Add 1-click **"Remove from Library"** on owned cards in `LibraryComponent` with live state persistence and UI sync
- [x] **13.3** Implement `removeFromLibrary(userId, gameId)` in `LibraryDataService` and `MockLibraryDataService` with LocalStorage/IndexedDB persistence
- [x] **13.4** Upgrade `OrdersComponent` Print Receipt into an official executive-grade 1-page A4 invoice:
  - Added `@page { size: A4 portrait; margin: 0; }` to strip browser headers, timestamps, and localhost URL stamps completely
  - Configured dynamic PDF document title naming (`NEXORA-Receipt-ord_XXXXX.pdf`)
  - Added `Billed To` customer metadata (name and email)
  - Implemented structured itemized accounting table (`Description`, `Format`, `Qty`, `Price`)
  - Added official proof-of-purchase legal statement and support reference
- [x] **13.5** Streamlined `CreatorStudioComponent` header by eliminating the redundant `[DEVELOPER DASHBOARD]` pill badge and vertical alignment mismatch
- [x] **13.6** Executed full quality gate verification: 51/51 unit, integration, and E2E checks passing (100%), 0 TypeScript errors, and 2.70s production build
- [x] **13.7** Implement interactive **Payment Method Selector** in `PurchaseConfirmModalComponent`:
  - Added live card brand switcher supporting **Visa Card** (`•••• 4242`) and **Mastercard** (`•••• 5555`)
  - Added interactive visual virtual credit card strip preview with chip icon, cardholder name, expiry, and dynamic brand theme
  - Added 256-bit encrypted security trust badge
  - Added `paymentMethod` persistence to `Order` model and displayed on official printable A4 invoice
  - Added automated test in regression test suite (22/22 tests passing)
- [x] **13.8** Add interactive **Password Visibility Toggle** (`[ 👁️ / 👁️‍🗨️ ]` eye button) to both **Sign In** (`/login`) and **Register** (`/register`) forms with dynamic `type="password" <-> "text"` switching, full accessibility attributes, and keyboard controls

---

## Phase 9: Impeccable Anti-Slop Elimination, DesignMD Alignment & Unified CI Gate (Task 14)

### Task 14: Comprehensive Impeccable Audit & Regression Suite Hardening
- [x] **14.1** Execute deep Impeccable design audit across 100% of storefront and administrative components against `DESIGN.md` and 50+ anti-slop rules
- [x] **14.2** Eliminate all residual neon glow halos (`box-shadow: 0 0 Xpx`) and SVG filter drop shadows across `PurchaseConfirmModal`, `DownloadButton`, `RoleBadge`, `EmptyState`, `GameDetail`, `GameCatalog`, `Header`, `Genres`, `CreatorStudio`, and `CreatorProfile`
- [x] **14.3** Convert `RoleBadgeComponent` from `9999px` bubble pills to Steam `4px` (`--radius-sm`) industrial micro-badges with monospace uppercase tracking
- [x] **14.4** Align `PurchaseConfirmModalComponent` and `EmptyStateComponent` action CTAs with `--steam-btn-gradient` token (`#75B022`) and directional ambient occlusion shadows (`0 4px 14px rgba(0,0,0,0.35)`)
- [x] **14.5** Upgrade `impeccable-anti-slop.spec.ts` into a standalone deterministic test suite verifying radii hierarchy, semantic color mappings, easing curves, kerning, and WCAG AAA contrast ratios
- [x] **14.6** Configure unified `npm test` and `npm run verify` scripts executing all 4 regression test tiers (Unit, Integration, Master, Impeccable) in under 4 seconds with 55/55 tests passing (100%)
- [x] **14.7** Validate production Angular build (0 errors, 0 warnings, 2.75s compile time, 96.87 kB initial transfer bundle)
- [x] **14.8** Standardize geometry & typography across all 13 views (replaced residual `9999px` bubble pills with crisp 6px buttons, 4px badges/filter chips, and 2px micro-tags with JetBrains Mono tracking)
- [x] **14.9** Implement Steam Desktop **"Sort By"** filter dropdown (`Featured`, `Newest Releases`, `Price: Low to High`, `Price: High to Low`, `Alphabetical: A to Z`) in `/catalog` with live URL query param synchronization and responsive layout balance

---

## Phase 10: Omni-Resolution Fluid Architecture, Fixed 16:9 Standard, Zero-Shift Media & 4-Slide Parity (Task 15)

### Task 15: Storefront Fluid Resiliency & 4-Slide Hero Sizing Parity
- [x] **15.1** Clean Text-Only Category Filter Rail: Removed noisy numeric count badges (`[ 10 ]`), added `<` / `>` smooth scrolling chevrons, and dual-edge linear gradient fade masks.
- [x] **15.2** Decoupled Absolute Media Framing (0.00px CLS): Set `.main-media-img` to `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;`, guaranteeing 0.00px Cumulative Layout Shift when hovering across thumbnails.
- [x] **15.3** Universal Fixed 16:9 Standard (`1280×720`): Standardized 100% of online seed assets in `seed-data.ts` to `w=1280&h=720&auto=format&fit=crop&q=80`.
- [x] **15.4** Symmetrical 2x2 Thumbnail Grid Geometry: Removed constricting `max-height` ceiling on `.mini-screenshot-thumb` to fill 100% cell width with uniform 6px horizontal/vertical gaps.
- [x] **15.5** Right Capsule Flagship Presentation: Added monospace `FEATURED SPOTLIGHT` eyebrow, Steam review sentiment pill `[ ● ★ 4.9 · Very Positive ]`, and Electric Cyan active thumbnail ring.
- [x] **15.6** Universal Seed Synchronization Engine: Fixed `MockGamesDataService.initData()` to deep-merge all 10 seed games on startup, resolving the stale `localStorage` 2-thumbnail bug.
- [x] **15.7** Omni-Resolution 4/3/2/1 Grid Progression & Fluid `clamp()` Tokens: Replaced rigid px values with fluid typography/padding and collapsed mobile hero strip (1x4 preview).
- [x] **15.8** Catalog Grid Card Geometry Invariance: Locked card titles (`1.4rem`), descriptions (`2.8em`), tag rows (`24px`), and footers (`42px`) for 100% uniform card heights across all rows.
- [x] **15.9** Expanded Automated Test Battery: 166 / 166 passing assertions (100% Green) across Unit Tests (Sections 1–21), Integration Tests (Sections 1–7), Master Battery, and Impeccable Anti-Slop suite.

---

## Phase 11: Speedtest Dual-Segment Switcher, Unified Steam Deck Hub Mobile Navigation & End-to-End Hardening (Task 16)

### Task 16: Speedtest Switcher, Unified Steam Deck Hub Drawer & Production Verification
- [x] **16.1** Speedtest.net Dual-Segment Theme Switcher: Built authentic 58x30px dual-segment pill switcher with 24px sliding indicator, Warm Amber (`#F59E0B`) Sun illumination, Electric Cyan (`#66C0F4`) Moon illumination, and fluid cubic-bezier motion.
- [x] **16.2** Unified Steam Deck Hub Mobile Drawer: Engineered zero-scroll compact layout with 36px navigation rows, 2px gaps, and hidden scrollbars, eliminating vertical scrollbars on 600px–844px mobile viewports.
- [x] **16.3** Consolidated 2-Row Footer Control Card: Combined user avatar, name, role badge, and squircle logout button in Row 1, and Speedtest Theme Switcher + Segmented Persona Switcher `[ Alice | Bob ]` in Row 2.
- [x] **16.4** Mobile Drawer Accessibility & Safe-Area Insets: Added keyboard focus trapping (`Tab`/`Shift+Tab`), auto-focus on close button, `Escape` key dismissal, and `env(safe-area-inset-bottom)` padding.
- [x] **16.5** Broken-Link Crawler Suite (`test:crawler`): Crawled 24/24 internal routes, game pages, creator profiles, and forms with 0 broken links.
- [x] **16.6** Expanded Automated Test Battery: 223 / 223 passing assertions (100% Green) across Unit Tests (Sections 1–26), Integration Tests (Sections 1–7), Master Battery, Impeccable Anti-Slop suite, Broken-Link Crawler, and Playwright E2E journeys.



---

## Phase 12: Header Navigation Motion System — Sliding Active-Tab Indicator & Asymmetric Drawer Animation (Task 17)

### Task 17: Header Nav Animations & Race-Safe Drawer Lifecycle
- [x] **17.1** Sliding Active-Tab Indicator: Single `.nav-active-indicator` underline glides between desktop nav tabs (Store, Genres, Library, Wishlist, Orders, Creator Studio) via signal-driven geometry (`computeIndicatorGeometry`), re-syncs on route/auth/creator changes and window resize, hides on routes with no active tab, replaces static per-tab `border-bottom`.
- [x] **17.2** Asymmetric Drawer Timing: Mobile drawer enters at 400ms ease-in-out S-curve (`cubic-bezier(0.55, 0.06, 0.18, 0.96)`, `DRAWER_ENTER_MS`) and exits at a crisp 240ms (`DRAWER_EXIT_MS`), with staggered section entrance (35ms steps, 260ms cap).
- [x] **17.3** Two-Frame Mount Commit Guard: Double `requestAnimationFrame` between drawer mount and `.drawer-open` class application eliminates ragged single-frame transition starts.
- [x] **17.4** Race-Safe Unmount Scheduling: Pure `DrawerCloseScheduler` (generation counter + `transitionend` primary trigger + timer fallback in `header-animations.ts`) guarantees rapid open/close toggling can never tear down an open drawer; focus restore to trigger element on close.
- [x] **17.5** Reduced-Motion & SSR Guards: Component-level `prefers-reduced-motion` overrides (~0.01ms transitions, no stagger) and `isPlatformBrowser` measurement guards keep the app SSR-safe.
- [x] **17.6** Expanded Automated Test Battery: 435 / 435 passing assertions (100% Green) across Unit Tests (Sections 1–86, incl. Section 86 header animation logic with fake-timer race tests), Integration Tests (51/51), Master Battery (10/10), and Impeccable Anti-Slop suite (7/7). Full `npm run verify` gate exit code 0.

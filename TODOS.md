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
| **Deployment and Ops** | Cloud hosting, tunnels & performance budgets | ✅ Ready | `vercel.json` SPA rewrites active, Cloudflare tunnel active, 96.8 kB initial bundle, DOM Interactive: 38ms |

---

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


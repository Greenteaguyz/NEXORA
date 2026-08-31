# Frontend Architecture — NEXORA (Angular)

Frontend-only prototype for a first-year capstone project: **NEXORA**, a sleek, modern cyberpunk and indie game distribution marketplace inspired by itch.io. Covers auth, role-aware access, ownership checks, CRUD listing forms, public discovery, a library, and controlled sample-package downloads. Real payments, malware scanning, and social/community features are out of scope.

---

## Brand & Application Identity

- **App Name / Branding**: **NEXORA**
- **Branding & UI Shell**: Top navigation bar with NEXORA logo wordmark, responsive nav links, active user role badges, dynamic page title tags (`NEXORA — Games Marketplace`), custom favicon, and footer copyright credits (`© 2026 NEXORA`).
- **Application Config & Meta**: `index.html` title (`NEXORA — Games Marketplace`), package name `nexora`, and auth placeholders (e.g., `welcome@nexora.io`, `alice@nexora.io`).
- **Design Tokens & Theme**: Sleek, modern cyberpunk/indie game distribution theme tailored to the NEXORA brand identity (deep void surfaces, glowing electric violet & cyber cyan accents, crisp cyber borders).
- **Documentation & Mock Seed Data**: Branded sample catalogs (cyberpunk, synthwave, retro indie titles), system notifications, and platform guides.

---

## Tech stack

- **Framework:** Angular, standalone components (no NgModules)
- **Markup:** HTML templates (Angular's template syntax)
- **Styling:** CSS, optionally Tailwind CSS utility classes for the design-system tokens in section 13 (color, spacing, radius) — Tailwind is a styling choice layered on top of the architecture above, not a replacement for it; component structure and the data abstraction layer are unaffected either way
- **Logic:** TypeScript (Angular's default), compiling to JS
- **Forms:** typed Reactive Forms
- **State:** Angular signals, no NgRx at this scale

---

## 1. High-level architectural style

A **layered, modular, feature-based architecture** built with Angular standalone components, organized into three layers:

```
core/       → singleton services, guards, interceptors, data abstraction layer
shared/     → reusable dumb components, pipes, directives, utils
features/   → feature modules (self-contained business domains)
```

Because there is no real backend yet, `core/data/` is an **interface-driven abstraction layer** rather than a thin HTTP wrapper. Every feature codes against an interface; the concrete implementation (in-memory mock now, real HTTP later) is swapped via Angular dependency injection tokens without touching feature code.

---

## 2. Folder structure

```
src/app/
├── core/
│   ├── auth/
│   │   ├── auth.service.ts          (interface-driven, session state via signals)
│   │   ├── auth.mock.ts             (fake login/roles, no real server)
│   │   ├── auth.guard.ts
│   │   ├── role.guard.ts
│   │   ├── ownership.guard.ts
│   │   └── password-logic.ts        (hardened password policy & lockout engine)
│   │
│   ├── services/                    (singleton reactive services)
│   │   ├── scroll-lock.service.ts   (ref-counted overlay scroll lock with iOS compensation)
│   │   ├── toast.service.ts         (notification queue, severity tiers, exit transitions)
│   │   ├── download.service.ts      (background download streams, bottom tray signals)
│   │   ├── command-palette.service.ts (global spotlight search shortcut)
│   │   └── ambient-color-extractor.service.ts (dynamic dominant hue quantization)
│   │
│   ├── data/                         ← the abstraction layer
│   │   ├── tokens.ts                  (InjectionTokens: GAMES, LIBRARY, ORDERS, USERS, WISHLIST, PAYMENTS)
│   │   ├── games/
│   │   ├── users/
│   │   ├── library/
│   │   ├── orders/                    (order creation, history, and purchase revert)
│   │   ├── wishlist/
│   │   └── payments/                  (implemented — mock payment methods, KHQR Bakong, wallet ledger, finance logic)
│   │
│   ├── persistence/
│   │   └── local-store.service.ts    (IndexedDB/localStorage — reactive "database")
│   │
│   └── models/                        (shared interfaces/types — the "contract", including finance.model.ts)
│
├── shared/
│   ├── ui/                            (game-card, download-button, khqr-card, payment-brand-mark, aba-payway-sheet, add-payment-method-form, toast…)
│   ├── directives/                    (card-number, cvv, expiry-date, scroll-lock, spatial-nav)
│   ├── pipes/
│   └── utils/
│
├── features/
│   ├── game-catalog/                  (public discovery, search, tags, URL sync)
│   ├── genres/                        (genre directory & tag aggregation)
│   ├── game-detail/                   (game details, 5-state download action, intent deep links, purchase revert)
│   ├── creator-profile/               (public creator storefront & game listings)
│   ├── creator-studio/                (CRUD listings, TagChipInput, unsavedChangesGuard, draft banner, 5s purge lock)
│   ├── library/                       (ownership checks, sample downloads, paid-game removal refund flow)
│   ├── wishlist/                      (buyer bookmarks & saved games)
│   ├── orders/                        (order receipts & printable A4 invoicing, refunded status)
│   ├── profile/                       (account settings, wallet stat card, change password)
│   ├── account-payment/               (credit cards, KHQR Bakong, gift cards, wallet balance ledger)
│   ├── support/                       (FAQ accordion, contact form & privacy notice)
│   ├── not-found/                     (404 error fallback)
│   └── auth/                          (login/register/forgot-password — mocked)
│
├── layout/
│   ├── header/                        (smart scroll-aware, Steam Deck Hub mobile drawer)
│   └── footer/                        (conditional navigation, legal safe-area clearance)
│
└── app.routes.ts                      (18-route central table with functional guards)
```

Community and live multiplayer features are deliberately absent (out of scope for this architecture). Commerce and payment workflows are fully supported via an interface-driven mock payments and wallet architecture (`PAYMENTS_DATA` injection token, `/account/payment` management hub, Cambodian KHQR Bakong mobile payments, credit card validation directives, prepaid gift card voucher redemption, checkout modal integration with ABA PayWay rail, and ledger-backed finance core).

---

## 3. Key architectural decisions

**a) Data abstraction via DI tokens, not services directly**

```typescript
// core/data/tokens.ts
export const GAMES_DATA = new InjectionToken<GamesDataService>('GAMES_DATA');

// app.config.ts
providers: [
  { provide: GAMES_DATA, useClass: GamesDataMockService }
  // later: swap to GamesDataHttpService — zero changes in features/
]
```
Features inject `GAMES_DATA`, never the concrete mock class. This is the single most important decision for a frontend-only build — it makes "add a real backend later" a config change instead of a rewrite.

**b) Fake persistence, real contract**

`core/persistence/local-store.service.ts` wraps IndexedDB (or `localStorage`) so mock data survives page refresh — closer to a working prototype than resetting to seed data every reload. Mock data services simulate async latency (`setTimeout` / RxJS `delay()`) so the UI already handles loading states correctly.

**c) Auth/role simulation matches the real shape**

`auth.mock.ts` issues a fake session object (`{ userId, role: 'creator' | 'buyer' }`) stored via the same persistence service. Guards (`authGuard`, `role.guard.ts`) read from `AuthService` signals — the same code path a real JWT-based backend would use. This directly supports the capstone's role-aware access and ownership-check requirements without a server.

**d) Ownership & CRUD fully exercised**

The mock data layer implements real filtering logic (`games.filter(g => g.ownerId === currentUserId)`) rather than hardcoded fixtures — a genuine prototype of the data model, not just a UI mockup.

**e) State management**

Signals-first: local component state via `signal()`, cross-cutting state (session, library additions) via small injectable services holding signals. No NgRx needed at this scale.

**f) Testing**

Mocked data services are pure functions over in-memory arrays — trivial to unit test, and component tests don't need `HttpTestingController` mocking.

**g) Download gating — account required for every download**

Downloads are not gated only for paid content — every download, including free games, requires an account. This is a deliberate choice so the ownership-check and Library features are exercised for all games, not just paid ones, and it keeps the download code path single-branch (no free-vs-paid special case).

---

## 4. Page flow

```
Public catalog (browse and search games)
        │
        ▼
Game detail page (any download click is gated)
        │
        ▼
Login / register  ── required for every download, not just paid content
        │
   ┌────┴─────┐
   ▼          ▼
Library    Creator studio
(buyer)    (create, edit, manage listings)
```

- **Public catalog → game detail** are unguarded routes — open to anyone, logged in or not.
- **Login / register** is not a fixed step users always pass through — it's triggered by `authGuard` whenever a download, library, or creator-studio route is hit without a session. On success, the guard redirects back to the originally requested route (`returnUrl`) — e.g. clicking "download" on a game detail page sends an anonymous user to login, then straight back to that game with the download proceeding.
- **Library vs. creator studio** is a role branch, not a mutually exclusive fork — a user can be both a buyer and a creator. Once authenticated, both routes exist in navigation; `role.guard.ts` separately checks `role: 'creator'` for studio routes, while library is open to any authenticated user.
- **Free vs. paid download** is a second branch that happens after the auth gate, not before it. Once logged in: a free game (`price === 0`) creates a `LibraryEntry` immediately and downloads. A paid game shows a `purchase-confirm-modal` first; confirming creates an `Order`, then the same `LibraryEntry` creation and download proceed. Both branches converge on the same download trigger — the only difference is whether an `Order` exists in between.

**Resolved:** `creator-studio` has its own `edit-listing` page (already reflected in the route table's `/studio/games/:id/edit`), reusing the same form component as "create." `game-detail` stays a single public, read-only view for everyone — no role-aware branching inside it. This is the simpler build: one component with one responsibility, rather than `game-detail` needing to detect ownership and conditionally render edit controls.

---

## 5. Data model

Core entities the mock data layer and every feature code against.

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  roles: ('buyer' | 'creator')[];   // user can possess both roles (e.g. Alice)
  createdAt: string;
}

interface Game {
  id: string;
  ownerId: string;             // FK → User.id (the creator)
  title: string;
  description: string;
  tags: string[];
  price: number;                // 0 = free
  coverImageUrl: string;
  screenshotUrls: string[];
  samplePackageUrl: string;      // static file, not a real build artifact
  createdAt: string;
  updatedAt: string;
}

interface LibraryEntry {
  id: string;
  userId: string;               // FK → User.id
  gameId: string;                // FK → Game.id
  acquiredAt: string;            // set the moment a gated download succeeds
  orderId?: string;              // FK → Order.id, present only for paid acquisitions
}

interface Order {
  id: string;
  userId: string;                // FK → User.id
  gameId: string;                 // FK → Game.id
  price: number;                  // snapshot of Game.price at purchase time
  status: 'confirmed';            // no real payment processor, so no pending/failed states
  createdAt: string;
}

interface WishlistEntry {
  id: string;
  userId: string;                // FK → User.id
  gameId: string;                 // FK → Game.id
  addedAt: string;                // set when the game is bookmarked
}
```

`LibraryEntry` is the join that makes ownership checks real — "does this user own this game" is `LibraryEntry` existence, not a field on `Game`. `Order` only exists for paid acquisitions — free downloads never create one. `WishlistEntry` is a separate join with no bearing on ownership — a game can be wishlisted, owned, both, or neither, independently.

**Creator-studio form validation (`Game`):**

| Field              | Rule                                                                             |
|--------------------|----------------------------------------------------------------------------------|
| `title`            | required, 3–80 characters                                                        |
| `description`      | required, 10–2000 characters                                                     |
| `tags`             | 1–5 tags, each 2–20 characters                                                   |
| `price`            | required, number ≥ 0, up to 2 decimal places (0 = free)                          |
| `coverImageUrl`    | required, must be a valid URL                                                    |
| `screenshotUrls`   | 0–6 URLs, each a valid URL                                                       |
| `samplePackageUrl` | required, must be a valid URL (points to a static sample file, not a real build) |

---

## 6. Route table

| Path                                     | Feature        | Guard(s)                                             | Role required              |
|------------------------------------------|----------------|------------------------------------------------------|----------------------------|
| `/` , `/catalog`                         | game-catalog   | none                                                 | —                          |
| `/genres`                                | genres         | none                                                 | —                          |
| `/games/:id`                             | game-detail    | none (download action is gated, not the route)       | —                          |
| `/creators/:id`                          | creator-profile| none                                                 | —                          |
| `/login`, `/register`, `/forgot-password`| auth           | none                                                 | —                          |
| `/library`                               | library        | `authGuard`                                          | any authenticated user     |
| `/wishlist`                              | wishlist       | `authGuard`                                          | any authenticated user     |
| `/orders`                                | orders         | `authGuard`                                          | any authenticated user     |
| `/profile`                               | profile        | `authGuard`                                          | any authenticated user     |
| `/studio`                                | creator-studio | `authGuard`, `roleGuard('creator')`                  | creator                    |
| `/studio/games/new`                      | creator-studio | `authGuard`, `roleGuard('creator')`                  | creator                    |
| `/studio/games/:id/edit`                 | creator-studio | `authGuard`, `roleGuard('creator')`, ownership check | creator (own listing only) |
| `/support`                               | support        | none                                                 | —                          |
| `/not-found`                             | not-found      | none                                                 | —                          |
| `**`                                     | not-found      | none (wildcard redirect to `/not-found`)             | —                          |

`authGuard` supports `returnUrl` so a gated action (login triggered by a download click) sends the user back to the exact page they came from.

---

## 7. Mock data service contract

Method signatures are written as if a real backend existed, so swapping `*.mock.ts` for `*.http.ts` later requires no changes outside `core/data/`.

```typescript
interface GamesDataService {
  getGames(filters?: { tag?: string; search?: string }): Observable<Game[]>;
  getGameById(id: string): Observable<Game | undefined>;
  createGame(dto: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Observable<Game>;
  updateGame(id: string, dto: Partial<Game>): Observable<Game>;
  deleteGame(id: string): Observable<void>;
}

interface LibraryDataService {
  getLibrary(userId: string): Observable<LibraryEntry[]>;
  addToLibrary(userId: string, gameId: string, orderId?: string): Observable<LibraryEntry>;
  isOwned(userId: string, gameId: string): Observable<boolean>;
}

interface OrdersDataService {
  createOrder(userId: string, gameId: string): Observable<Order>;
  getOrders(userId: string): Observable<Order[]>;
}

interface WishlistDataService {
  getWishlist(userId: string): Observable<WishlistEntry[]>;
  addToWishlist(userId: string, gameId: string): Observable<WishlistEntry>;
  removeFromWishlist(userId: string, gameId: string): Observable<void>;
}
```

**Free vs. paid branch** (in `download-button`): if `game.price === 0`, call `addToLibrary` directly. If `game.price > 0`, show a confirmation step, then call `createOrder` followed by `addToLibrary(userId, gameId, order.id)`. Both paths converge on the same download trigger once the `LibraryEntry` exists.

**Wishlist is intentionally decoupled from ownership.** `WishlistDataService` is a separate token from `LibraryDataService` — bookmarking a game has no effect on the download button's state, and a wishlisted game that's also owned still renders as "Owned." `WishlistComponent` injects `WISHLIST_DATA` directly; it does not call `LocalStoreService` itself, which keeps it consistent with every other data-backed feature in this architecture (see [DI Abstraction Explanation](explanation-di-abstraction.md)).

---

## 8. Authorization matrix

| Action                          | Anonymous              | Buyer              | Creator (own listing) | Creator (others' listing) |
|---------------------------------|------------------------|--------------------|-----------------------|---------------------------|
| Browse catalog                  | ✅                     | ✅                 | ✅                    | ✅                      |
| View game detail                | ✅                     | ✅                 | ✅                    | ✅                      |
| Download a free game            | ❌ (redirect to login) | ✅                 | ✅                    | ✅                      |
| Purchase + download a paid game | ❌ (redirect to login) | ✅ (confirm step)  | ✅ (confirm step)     | ✅ (confirm step)       |
| View library                    | ❌                     | ✅                 | ✅                    | ✅                      |
| Create listing                  | ❌                     | ❌                 | ✅                    | —                        |
| Edit listing                    | ❌                     | ❌                 | ✅                    | ❌                      |
| Delete listing                  | ❌                     | ❌                 | ✅                    | ❌                      |

A creator downloading their own game still goes through the normal gated-download path — it creates a `LibraryEntry` like any other download, since ownership of the *listing* and ownership of a *library copy* are tracked separately.

---

## 9. Shared UI component inventory

| Component                | Inputs                             | Outputs                                           |
|--------------------------|------------------------------------|---------------------------------------------------|
| `game-card`              | `game: Game`                       | `select`                                          |
| `download-button`        | `game: Game`, `isOwned: boolean`   | `download`, `loginRequired`, `purchaseConfirmed`  |
| `rating-stars`           | *(deferred — ratings out of scope)*| —                                                 |
| `role-badge`             | `role: 'buyer' \| 'creator'`       | —                                                 |
| `empty-state`            | `message: string`, `icon?: string` | —                                                 |
| `purchase-confirm-modal` | `game: Game`                       | `confirm`, `cancel`                               |
| `loading-spinner`        | `size?: 'sm' \| 'md'`              | —                                                 |

Build components here only when a second feature needs the same UI — avoid speculative shared components before there's a real duplication.

---

## 10. Error & loading state convention

Since the mock data layer simulates network latency, every feature needs a consistent pattern rather than inventing one per component:

- Each smart component exposes `loading`, `error`, and `data` as signals (or a single `resource()` state if using Angular's `resource()` API).
- `shared/ui/loading-spinner` and `shared/ui/empty-state` are the only components used to render these states — no feature writes its own spinner markup.
- Mock services simulate occasional failures (not just latency) so error-state UI is actually exercised during development, not just assumed to work.

---

## 11. Milestone-to-architecture mapping

| Milestone                         | Architecture touched                                                                                |
|-----------------------------------|-----------------------------------------------------------------------------------------------------|
| M0 — plan/design                  | This document; data model; route table                                                              |
| M1 — auth foundation              | `core/auth/*`, `authGuard`, `roleGuard`, login/register feature                                     |
| M2 — public catalogue             | `game-catalog`, `game-detail`, `GamesDataService` read paths                                        |
| M3 — creator studio               | `creator-studio` feature, `GamesDataService` write paths, ownership checks                          |
| M4 — library/download             | `library` feature, `LibraryDataService`, gated download flow                                        |
| M5 — quality/testing/presentation | Unit tests against mock services, error/loading state coverage, this doc as presentation reference  |

---

## 12. UI design conventions

A lightweight, low-cost design pass — not a full interaction-design system. Chosen to make the UI feel deliberate without spending capstone time on animation work unrelated to the graded scope (auth, roles, ownership, CRUD, data flow).

- **Instant press feedback** — `:active` states on buttons and game cards, no debounce delay on clicks. Applied once in `shared/ui`, inherited everywhere.
- **Reduced motion support** — any transitions added are wrapped in `@media (prefers-reduced-motion: reduce)`.
- **Typography discipline** — a consistent type scale defined as CSS custom properties: tighter letter-spacing on headings, comfortable line-height on body/description text, weight used for hierarchy rather than size alone.
- **Direct, specific labels** — nav and route names describe their contents ("Library", "Creator studio") rather than vague umbrellas ("Home", "Dashboard").

Explicitly out of scope: spring physics, drag/gesture recognizers, velocity handoff, momentum projection, translucent material layering, haptics. These require a dedicated animation library and framework-specific tuning disproportionate to the project's timeline and grading criteria.

---

## 13. Visual design system

Extends section 12 — defined once in `src/styles.css`, inherited everywhere across the NEXORA app shell and feature components.

- **Color and spacing tokens** — Sleek, modern cyberpunk/indie game distribution theme tailored to the NEXORA brand identity. Built with deep void dark backgrounds, glowing electric violet and cyber cyan accents, high-contrast typography, and glowing borders:

```css
/* ==========================================================================
   NEXORA DESIGN TOKENS (CSS Custom Properties)
   ========================================================================== */
:root {
  /* Brand Primary — Electric Violet */
  --accent-400:    #A78BFA;
  --accent-500:    #8B5CF6;  /* glow highlights */
  --accent-600:    #7C3AED;  /* primary brand CTA / active links */
  --accent-700:    #6D28D9;  /* hover & active states */

  /* Cyber Accents */
  --cyan-400:      #22D3EE;  /* cyber cyan — info badges, genre chips */
  --cyan-500:      #06B6D4;
  --emerald-400:   #34D399;  /* neon emerald — owned badges, free tags */
  --emerald-500:   #10B981;
  --rose-500:      #F43F5E;  /* neon danger — soft delete modal, errors */

  /* Surfaces & Backgrounds */
  --bg-void:       #0B0D13;  /* root canvas background */
  --bg-surface:    #131622;  /* game cards, header, sidebar */
  --bg-elevated:   #1A1E2E;  /* modals, popovers, dropdowns */
  --bg-input:      #0E111B;  /* form inputs, search bar */

  /* Semantic Text Colors */
  --text-primary:   #F8FAFC;  /* main headlines & titles */
  --text-secondary: #94A3B8;  /* descriptions & metadata */
  --text-muted:     #64748B;  /* placeholders, timestamps */

  /* Borders & Glow Effects */
  --border-card:    #1E2438;
  --border-subtle:  rgba(139, 92, 246, 0.15);
  --border-glow:    rgba(139, 92, 246, 0.4);
  --shadow-glow:    0 0 20px rgba(124, 58, 237, 0.25);

  /* Spacing Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Border Radii */
  --radius-sm: 4px;
  --radius:    8px;   /* standard button / card radius */
  --radius-lg: 12px;  /* modal container radius */

  /* Typography */
  --font-sans: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

- **Designed empty and loading states** — `empty-state` and `loading-spinner` (already in the component inventory) get an authentic gaming platform aesthetic: glowing neon spinners, atmospheric empty state vectors, and actionable CTAs.
- **Consistent catalog grid** — responsive CSS Grid with consistent 16:9 / poster card aspect ratios and subtle neon border hover transitions.
- **Consistent form styling** — unified cyber-dark inputs with focus glow rings reused across login, register, and Creator Studio forms.

---

## 14. Build details

Smaller decisions that don't need their own section but should be settled before they're needed, not decided ad hoc mid-build.

- **Seed data** — a fixed set of mock users (at least one buyer, one creator) and ~8–12 mock games covering both free and paid, loaded on first run. Seeded data persists across refreshes via `local-store.service.ts` rather than resetting every reload, so the catalog and library look populated during both dev and the final demo.
- **Session persistence** — a mock login persists across page refresh (stored via the same persistence layer as seed data), rather than resetting on every reload. Keeps `authGuard` behavior consistent during dev and avoids re-logging-in mid-demo.
- **Search/filter logic** — `getGames(filters)`'s `search` parameter matches against `title` only (substring, case-insensitive), not `description` or `tags`, to keep the mock implementation simple and predictable. `tag` filtering is an exact match against the `tags` array.
- **Test strategy** — unit tests target `core/data/*` mock services (pure functions over arrays — cheapest to test, highest value) and `core/auth/*` guards (role/auth branching logic). Component tests are opportunistic, not required for every component — prioritize `download-button`'s free/paid branch and `creator-studio` form validation, since those carry the most logic.

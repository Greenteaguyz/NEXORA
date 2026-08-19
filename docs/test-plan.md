# Test plan and verification matrix

This document details the automated test specifications and manual verification procedures for NEXORA.

---

## Automated unit test specifications

### Download button component (`shared/ui/download-button/download-button.component.spec.ts`)

| Scenario | State / Inputs | Expected Button Label | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **Anonymous User** | `currentUser = null`, `game.price = 10` | **Download** | Emits `loginRequired` event with active route URL. |
| **Free and Unowned** | `currentUser = {id: '1'}`, `game.price = 0`, `isOwned = false` | **Download Free** | Calls `addToLibrary()` and triggers file download. |
| **Paid and Unowned** | `currentUser = {id: '1'}`, `game.price = 9.99`, `isOwned = false` | **Buy $9.99** | Emits `purchaseConfirmed` to open purchase modal. |
| **Owned Game** | `currentUser = {id: '1'}`, `isOwned = true` | **Download** | Emits `download` to initiate direct file download. |
| **Soft-Deleted Game** | `currentUser = {id: '1'}`, `game.deletedAt = '...'` | **Unavailable** | Renders button in disabled state (`[disabled]="true"`). |

---

### Functional route guards (`core/auth/*.guard.spec.ts`)

| Guard | Scenario | Expected Outcome |
| :--- | :--- | :--- |
| `authGuard` | Unauthenticated access to `/library` | Returns `UrlTree` to `/login?returnUrl=%2Flibrary`. |
| `authGuard` | Authenticated access to `/library` | Returns `true`. |
| `authGuard` | Unauthenticated access to `/orders` | Returns `UrlTree` to `/login?returnUrl=%2Forders`. |
| `authGuard` | Authenticated access to `/orders` | Returns `true`. |
| `authGuard` | Unauthenticated access to `/profile` | Returns `UrlTree` to `/login?returnUrl=%2Fprofile`. |
| `roleGuard('creator')` | User with `roles: ['buyer']` visits `/studio` | Returns `UrlTree` to `/catalog`. |
| `roleGuard('creator')` | User with `roles: ['buyer', 'creator']` visits `/studio` | Returns `true`. |
| `ownershipGuard` | Creator edits own listing (`ownerId === currentUser.id`) | Returns `true`. |
| `ownershipGuard` | Creator edits another creator's listing | Returns `UrlTree` to `/studio`. |

---

### Authentication service (`core/auth/auth.service.spec.ts`)

| Test Case | Expected Behavior |
| :--- | :--- |
| **Synchronous Hydration** | `currentUser` signal reads stored session from `LocalStoreService` upon initialization without route flicker. |
| **Session Lifecycle** | `login()` updates the signal and storage; `logout()` clears session state without mutating database seed records. |
| **Role Assignment** | `register()` with `isCreator = true` assigns dual `['buyer', 'creator']` roles. |

---

## Automated test suite execution

NEXORA provides 5 automated test runners:

### 1. Domain integration and unit regression runner
```bash
npm run test:regression
```
* **Coverage**: LocalStorage persistence, seed data integrity, games catalog filtering, authentication roles, wishlist/library state transitions, and order fulfillment.

### 2. End-to-end user workflow runner
```bash
npx tsc src/app/core/tests/rigorous-validation-suite.ts --outDir dist/tests --module commonjs --target es2022 --skipLibCheck
node dist/tests/rigorous-validation-suite.js http://localhost:4200
```
* **Coverage**: Complete buyer purchasing flows, interactive download progress, digital receipt viewer, Creator Studio CRUD, and theme toggling.

### 3. Combined deep security, accessibility, and chaos battery
```bash
npx tsc src/app/core/tests/ultimate-deep-battery.ts --outDir dist/tests --module commonjs --target es2022 --skipLibCheck
node dist/tests/ultimate-deep-battery.js http://localhost:4200
```
* **Coverage**: WCAG 2.1 AA/AAA accessibility landmarks, XSS input fuzzing, 10x concurrent purchase debouncing, corrupted storage recovery, navigation performance timing, and Mozilla Firefox engine rendering.

### 4. Mobile touch and device emulation audit
```bash
npx tsc src/app/core/tests/mobile-ui-ux-deep-test.ts --outDir dist/tests --module commonjs --target es2022 --skipLibCheck
node dist/tests/mobile-ui-ux-deep-test.js http://localhost:4200
```
* **Coverage**: Touch interaction testing across iPhone 14 Pro, Google Pixel 7, and iPhone SE emulations.

### 5. Route redirect and guard logic audit
```bash
npx tsc src/app/core/tests/redirect-logic-audit.ts --outDir dist/tests --module commonjs --target es2022 --skipLibCheck
node dist/tests/redirect-logic-audit.js http://localhost:4200
```
* **Coverage**: Root path redirection, wildcard 404 deflection, unauthenticated query parameter preservation, and ownership guard enforcement.

---

## Manual verification procedures

Use the following preconfigured demo accounts during manual testing:

* `alice@nexora.io` (Buyer + Creator) — Test purchasing, library access, and Creator Studio publishing.
* `bob@nexora.io` (Buyer) — Test catalog browsing, acquisitions, and role guard redirection.
* `carol@nexora.io` (Creator) — Test listing management and ownership enforcement.

*(Password for all demo accounts: `password123`).*

---

### Critical test journeys

#### Journey 1: Gated download redirect flow
1. Navigate to `/catalog` as an anonymous user.
2. Select a paid game (for example, `$4.99`).
3. Click **Download**. Verify redirection to `/login?returnUrl=/games/{id}`.
4. Sign in with `bob@nexora.io`.
5. Verify automatic return to `/games/{id}`.
6. Click **Buy $4.99** to open the purchase modal.
7. Click **Confirm Purchase**. Verify that the button switches to **Download** and the download progress bar initiates.
8. Navigate to `/library` and verify the game appears in your collection.
9. Navigate to `/orders` and verify the purchase receipt is listed.

#### Journey 2: Catalog tag filtering and search
1. On `/catalog`, click the **RPG** tag chip. Verify the grid filters to RPG titles.
2. Type `space` in the search input. Verify results update smoothly after the 300ms debounce interval.
3. Clear filters and verify that the full catalog renders.

#### Journey 3: Role-based access control
1. Sign in as `bob@nexora.io` (buyer account).
2. Manually enter `/studio` in your browser address bar.
3. Verify that `roleGuard` redirects you to `/catalog`.
4. Sign in as `carol@nexora.io` (creator account).
5. Open `/studio` and verify that the table lists only Carol's games.

#### Journey 4: Wishlist management
1. Sign in as `alice@nexora.io`.
2. Click the heart icon on any game card in `/catalog`.
3. Open `/wishlist` and verify the title is present in your saved collection.
4. Click the heart icon again to remove the title from the wishlist.

#### Journey 5: Genre directory navigation
1. Navigate to `/genres`.
2. Verify that all genre cards render with active game count badges.
3. Click on the **RPG** card. Verify that the browser navigates to `/catalog?tag=RPG` with the catalog pre-filtered.

#### Journey 6: Creator portfolio storefront
1. On `/games/game_001`, click the creator link (**Created by Carol**).
2. Verify navigation to `/creators/usr_carol`, displaying Carol's profile, creator badge, and published titles.

#### Journey 7: 404 fallback routing
1. Enter a non-existent URL (for example, `/invalid-path`).
2. Verify redirection to `/not-found` with the "Level Not Found" headline and a **Back to Catalog** button.
3. Click **Back to Catalog** and verify navigation to `/catalog`.

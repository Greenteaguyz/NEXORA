# API & data services reference

This document defines the core data service interfaces, methods, parameters, return types, and `InjectionToken` constants in NEXORA.

---

## Service interfaces

### GamesDataService

Manages game catalog querying, detail retrieval, creation, updates, and soft deletion.

```typescript
export interface GamesDataService {
  getGames(filters?: { tag?: string; search?: string }): Observable<Game[]>;
  getGameById(id: string): Observable<Game | undefined>;
  createGame(dto: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Observable<Game>;
  updateGame(id: string, dto: Partial<Game>): Observable<Game>;
  deleteGame(id: string): Observable<void>;
}
```

* **`getGames(filters)`**: Returns an `Observable<Game[]>` of active game listings matching the optional tag or search query. Excludes soft-deleted games.
* **`getGameById(id)`**: Returns an `Observable<Game | undefined>` matching the provided identifier.
* **`createGame(dto)`**: Creates a new game record, assigning an identifier and initial timestamps.
* **`updateGame(id, dto)`**: Patches fields on an existing game and updates `updatedAt`.
* **`deleteGame(id)`**: Populates `deletedAt` with the current ISO timestamp to soft-delete the record.

---

### LibraryDataService

Tracks game acquisitions and ownership verification for user accounts.

```typescript
export interface LibraryDataService {
  getLibrary(userId: string): Observable<LibraryEntry[]>;
  addToLibrary(userId: string, gameId: string, orderId?: string): Observable<LibraryEntry>;
  removeFromLibrary(userId: string, gameId: string): Observable<void>;
  isOwned(userId: string, gameId: string): Observable<boolean>;
}
```

* **`getLibrary(userId)`**: Returns all `LibraryEntry` records associated with the user ID.
* **`addToLibrary(userId, gameId, orderId?)`**: Creates a new ownership record with the current timestamp.
* **`removeFromLibrary(userId, gameId)`**: Removes an existing ownership record from the user's account and updates local storage.
* **`isOwned(userId, gameId)`**: Returns `true` if a matching library record exists for the user and game.

---

### OrdersDataService

Handles purchase transaction records for paid game acquisitions.

```typescript
export interface OrdersDataService {
  createOrder(userId: string, gameId: string): Observable<Order>;
  getOrders(userId: string): Observable<Order[]>;
}
```

* **`createOrder(userId, gameId)`**: Captures a snapshot of the current game price, assigns status `'confirmed'`, and returns the completed `Order`.
* **`getOrders(userId)`**: Returns the purchase history for a given user.

---

### UsersDataService

Provides user account lookups and creator profile resolution.

```typescript
export interface UsersDataService {
  getUser(id: string): Observable<User | undefined>;
}
```

* **`getUser(id)`**: Retrieves a `User` entity by identifier.

---

### WishlistDataService

Manages bookmarked titles for authenticated accounts.

```typescript
export interface WishlistDataService {
  getWishlist(userId: string): Observable<WishlistEntry[]>;
  addToWishlist(userId: string, gameId: string): Observable<WishlistEntry>;
  removeFromWishlist(userId: string, gameId: string): Observable<void>;
  isWishlisted(userId: string, gameId: string): Observable<boolean>;
}
```

* **`getWishlist(userId)`**: Retrieves all saved wishlist items for the specified user.
* **`addToWishlist(userId, gameId)`**: Creates a new `WishlistEntry`.
* **`removeFromWishlist(userId, gameId)`**: Removes the corresponding wishlist record.
* **`isWishlisted(userId, gameId)`**: Returns boolean indicating if title is in user's wishlist.

---

### PaymentsDataService

Manages stored payment methods (Credit Cards and Cambodian KHQR Bakong), prepaid gift card redemptions, and wallet transactions.

```typescript
export interface PaymentsDataService {
  getMethods(userId: string): Observable<PaymentMethod[]>;
  addMethod(userId: string, dto: AddPaymentMethodDto): Observable<AddMethodResult>;
  removeMethod(userId: string, methodId: string): Observable<PaymentMethod[]>;
  setDefaultMethod(userId: string, methodId: string): Observable<PaymentMethod[]>;
  getWalletSnapshot(userId: string): Observable<WalletSnapshot>;
  topUp(userId: string, amount: number, methodId: string): Observable<TopUpResult>;
  getGiftCards(): Observable<GiftCard[]>;
  redeemGiftCode(userId: string, code: string): Observable<RedeemCodeResult>;
}
```

* **`getMethods(userId)`**: Retrieves saved credit card and KHQR payment methods for the user.
* **`addMethod(userId, dto)`**: Validates and saves a new card or KHQR handle.
* **`removeMethod(userId, methodId)`**: Removes a saved funding source.
* **`setDefaultMethod(userId, methodId)`**: Marks a specific payment method as primary default.
* **`getWalletSnapshot(userId)`**: Returns current wallet balance and transaction ledger.
* **`topUp(userId, amount, methodId)`**: Credits funds to the wallet from a chosen payment method.
* **`getGiftCards()`**: Returns available prepaid codes.
* **`redeemGiftCode(userId, code)`**: Validates gift code, credits balance, and records transaction.

---

## Dependency injection tokens

NEXORA registers data services using Angular `InjectionToken` instances declared in `src/app/core/data/tokens.ts`:

| Injection Token | Bound Service Interface | Default Mock Implementation |
| :--- | :--- | :--- |
| `GAMES_DATA` | `GamesDataService` | `MockGamesDataService` |
| `LIBRARY_DATA` | `LibraryDataService` | `MockLibraryDataService` |
| `ORDERS_DATA` | `OrdersDataService` | `MockOrdersDataService` |
| `USERS_DATA` | `UsersDataService` | `MockUsersDataService` |
| `WISHLIST_DATA` | `WishlistDataService` | `MockWishlistDataService` |
| `PAYMENTS_DATA` | `PaymentsDataService` | `MockPaymentsDataService` |

### Provider registration example

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { GAMES_DATA, PAYMENTS_DATA } from './core/data/tokens';
import { MockGamesDataService } from './core/data/games/mock-games-data.service';
import { MockPaymentsDataService } from './core/data/payments/mock-payments-data.service';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: GAMES_DATA, useClass: MockGamesDataService },
    { provide: PAYMENTS_DATA, useClass: MockPaymentsDataService }
  ]
};
```

---

## Core application services

In addition to data abstraction tokens, NEXORA provides reactive singleton services in `src/app/core/services/`:

### ScrollLockService (`scroll-lock.service.ts`)
Atomic ref-counted scroll lock for fullscreen overlays, dialogs, drawers, and modal popups.
* **`lock()`**: Increments ref count; when transition from 0 to 1, freezes body via `position: fixed` technique on iOS/Safari, compensates for scrollbar gutter shift (`padding-right`), and remembers vertical scroll position.
* **`unlock()`**: Decrements ref count; when reaching 0, restores native body position and restores scroll offset. Safe no-op if called below 0.
* **`isLocked`**: Reactive `Signal<boolean>`.

### ToastService (`toast.service.ts`)
Notification queue with severity auto-hide tiers, pause-on-hover, stack limits, and exit animations.
* **`show(payload, durationMs?)`**: Enqueues a toast. Default auto-hide durations: `success` (3.5s), `info`/`download` (4s), `warning` (5s), `error` (7s). Max 3 visible; older toasts evicted. Deduplicates identical alerts.
* **`dismiss(id)`**: Transitions toast to `leaving: true` for 180ms CSS exit animation before removing from queue.
* **`pause(id)` / `resume(id)`**: Suspends and resumes auto-dismiss timer on mouseenter/focus.
* **`toasts`**: Reactive `Signal<ToastItem[]>`.

### DownloadService (`download.service.ts`)
Manages background game acquisition packages, speed calculation, and bottom download tray state.
* **`activeDownloads`**: Reactive `Signal<DownloadItem[]>`.
* **`isTrayOpen`**: Reactive `Signal<boolean>`.
* **`startDownload(game, platform)`**: Simulates multi-stage package stream with progress percentages and speed simulation.
* **`cancelDownload(gameId)`**: Terminates active stream.
* **`openTray()` / `closeTray()` / `toggleTray()`**: Controls tray drawer visibility.

### CommandPaletteService (`command-palette.service.ts`)
Global shortcut (`Ctrl+K` / `Cmd+K`) spotlight dialog for search, navigation, and shortcuts.
* **`isOpen`**: Reactive `Signal<boolean>`.
* **`open()` / `close()` / `toggle()`**: Manages palette visibility.

### AmbientColorExtractorService (`ambient-color-extractor.service.ts`)
Client-side Canvas color quantization extracting prominent theme hues from cover images for dynamic ambient glow backdrops.

---

## Related documentation

* [Why We Use a Dependency Injection Abstraction Layer](./explanation-di-abstraction.md)
* [How to Add and Swap Data Services via DI](./howto-data-layer.md)
* [Data Models Reference](./reference-data-models.md)

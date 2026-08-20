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
}
```

* **`getWishlist(userId)`**: Retrieves all saved wishlist items for the specified user.
* **`addToWishlist(userId, gameId)`**: Creates a new `WishlistEntry`.
* **`removeFromWishlist(userId, gameId)`**: Removes the corresponding wishlist record.

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

### Provider registration example

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { GAMES_DATA } from './core/data/tokens';
import { MockGamesDataService } from './core/data/games/mock-games-data.service';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: GAMES_DATA, useClass: MockGamesDataService }
  ]
};
```

---

## Related documentation

* [Why We Use a Dependency Injection Abstraction Layer](./explanation-di-abstraction.md)
* [How to Add and Swap Data Services via DI](./howto-data-layer.md)
* [Data Models Reference](./reference-data-models.md)

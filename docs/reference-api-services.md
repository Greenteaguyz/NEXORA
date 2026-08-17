This document covers the core data service interfaces that make up the data layer of **NEXORA**. It details the methods, parameters, and return types for `GamesDataService`, `LibraryDataService`, `OrdersDataService`, `UsersDataService`, and `WishlistDataService`. It also outlines the dependency injection tokens used to provide these services and the pattern for swapping between mock data and HTTP implementations.

## Data Service Interfaces

### GamesDataService

Manages CRUD operations and catalog retrieval for game listings.

*   **`getGames(filters?: { tag?: string; search?: string })`**
    *   **Returns**: `Observable<Game[]>`
    *   **Behavior**: Retrieves a list of active games. If `filters` are provided, it narrows the results by tag or title search. Soft-deleted games are excluded.
*   **`getGameById(id: string)`**
    *   **Returns**: `Observable<Game | undefined>`
    *   **Behavior**: Retrieves a specific game by its ID. Returns `undefined` if the game does not exist.
*   **`createGame(dto: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>)`**
    *   **Returns**: `Observable<Game>`
    *   **Behavior**: Creates a new game listing. The implementation assigns a new ID and current timestamps for `createdAt` and `updatedAt`.
*   **`updateGame(id: string, dto: Partial<Game>)`**
    *   **Returns**: `Observable<Game>`
    *   **Behavior**: Patches an existing game with the provided fields and updates the `updatedAt` timestamp.
*   **`deleteGame(id: string)`**
    *   **Returns**: `Observable<void>`
    *   **Behavior**: Performs a soft delete by setting the `deletedAt` timestamp on the specified game.

### LibraryDataService

Manages user ownership and access to games.

*   **`getLibrary(userId: string)`**
    *   **Returns**: `Observable<LibraryEntry[]>`
    *   **Behavior**: Retrieves all library entries belonging to the specified user.
*   **`addToLibrary(userId: string, gameId: string, orderId?: string)`**
    *   **Returns**: `Observable<LibraryEntry>`
    *   **Behavior**: Grants a user access to a game by creating a `LibraryEntry`. The `acquiredAt` timestamp is set immediately. For paid games, the `orderId` must be provided.
*   **`isOwned(userId: string, gameId: string)`**
    *   **Returns**: `Observable<boolean>`
    *   **Behavior**: Convenience method that returns `true` if a library entry exists matching both the user ID and game ID.

### OrdersDataService

Handles the creation and retrieval of purchase transactions.

*   **`createOrder(userId: string, gameId: string)`**
    *   **Returns**: `Observable<Order>`
    *   **Behavior**: Processes a purchase. It snapshots the current `Game.price` into the new order, sets the status to `'confirmed'`, and generates an ID and timestamp.
*   **`getOrders(userId: string)`**
    *   **Returns**: `Observable<Order[]>`
    *   **Behavior**: Retrieves the purchase history for a specific user.

### UsersDataService

Provides access to user profile information.

*   **`getUser(id: string)`**
    *   **Returns**: `Observable<User | undefined>`
    *   **Behavior**: Retrieves a user record by ID. Returns `undefined` if not found.

### WishlistDataService

Manages a user's bookmarked (not-yet-owned) games. Added to close a gap where `WishlistComponent` previously called `LocalStoreService` directly instead of going through the same DI-token pattern as every other data-backed feature — see [Data Models Reference](reference-data-models.md#wishlistentry).

*   **`getWishlist(userId: string)`**
    *   **Returns**: `Observable<WishlistEntry[]>`
    *   **Behavior**: Retrieves all wishlist entries belonging to the specified user.
*   **`addToWishlist(userId: string, gameId: string)`**
    *   **Returns**: `Observable<WishlistEntry>`
    *   **Behavior**: Bookmarks a game for a user by creating a `WishlistEntry`. The `addedAt` timestamp is set immediately.
*   **`removeFromWishlist(userId: string, gameId: string)`**
    *   **Returns**: `Observable<void>`
    *   **Behavior**: Removes the matching `WishlistEntry` for the given user and game.

## Dependency Injection Tokens and Mock Swap Pattern

To decouple components from concrete implementations, the application uses Angular `InjectionToken`s for each service interface. This allows seamless swapping between a mock data service (used for the capstone project) and a real HTTP client implementation later.

**Injection Tokens:**
*   `GAMES_DATA`
*   `LIBRARY_DATA`
*   `ORDERS_DATA`
*   `USERS_DATA`
*   `WISHLIST_DATA`

## Code Examples

**Defining and Providing a Token**
```typescript
import { InjectionToken } from '@angular/core';

export const GAMES_DATA = new InjectionToken<GamesDataService>('GAMES_DATA');

// In app.config.ts
providers: [
  { provide: GAMES_DATA, useClass: MockGamesDataService }
]
```

**Consuming a Service in a Component**
```typescript
import { Component, inject } from '@angular/core';

@Component({...})
export class CatalogComponent {
  private gamesService = inject(GAMES_DATA);
  
  games$ = this.gamesService.getGames();
}
```

## Related Documentation

*   [Explanation: Dependency Injection Abstraction](explanation-di-abstraction.md)
*   [How-to: Data Layer Setup](howto-data-layer.md)
*   [How-to: Creator Studio](howto-creator-studio.md)
*   [Data Models Reference](reference-data-models.md) — see `WishlistEntry`

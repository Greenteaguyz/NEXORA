This document provides a complete reference for the data models used in **NEXORA**. It details the `User`, `Game`, `LibraryEntry`, `WishlistEntry`, and `Order` interfaces, including all fields, types, constraints, and relationships. It also covers the form validation rules for creating or editing games and the soft-delete pattern used for game listings.

## Data Models

### User

The `User` model represents an authenticated account in the system.

*   **`id`** (`string`): Unique identifier for the user.
*   **`email`** (`string`): The user's email address. This is the identifier the mock authentication service matches against when logging in — see [How to Set Up the Auth & Guard System](howto-auth-system.md). It must be unique across seeded users.
*   **`displayName`** (`string`): The user's public-facing name.
*   **`roles`** (`('buyer' | 'creator')[]`): An array of roles assigned to the user. Determines authorization for various actions.
*   **`createdAt`** (`string`): ISO timestamp of account creation.

### Game

The `Game` model represents a product listing in the marketplace.

*   **`id`** (`string`): Unique identifier for the game.
*   **`ownerId`** (`string`): Foreign key referencing `User.id`. Represents the creator who owns this listing.
*   **`title`** (`string`): The name of the game.
*   **`description`** (`string`): Detailed text describing the game.
*   **`tags`** (`string[]`): Array of category tags (e.g., action, puzzle).
*   **`price`** (`number`): The cost of the game. A value of `0` indicates a free game. There is no separate boolean "free" flag anywhere in the model — always derive free/paid status from `price === 0`.
*   **`coverImageUrl`** (`string`): URL to the primary image for the game.
*   **`screenshotUrls`** (`string[]`): Array of URLs for secondary screenshots.
*   **`samplePackageUrl`** (`string`): URL pointing to a static file in `assets/sample-packages/`.
*   **`deletedAt`** (`string`, optional): ISO timestamp indicating when the game was soft-deleted. If undefined, the game is active. There is no separate `status` string field — soft-delete state is always derived from the presence of `deletedAt`.
*   **`createdAt`** (`string`): ISO timestamp of listing creation.
*   **`updatedAt`** (`string`): ISO timestamp of the last update to the listing.

### LibraryEntry

The `LibraryEntry` model tracks which users own which games.

*   **`id`** (`string`): Unique identifier for the entry.
*   **`userId`** (`string`): Foreign key referencing `User.id`.
*   **`gameId`** (`string`): Foreign key referencing `Game.id`.
*   **`acquiredAt`** (`string`): ISO timestamp set the moment a gated download succeeds.
*   **`orderId`** (`string`, optional): Foreign key referencing `Order.id`. Present only if the game was acquired through a paid transaction.

### WishlistEntry

The `WishlistEntry` model tracks which games a user has bookmarked for later, independent of ownership. Like `LibraryEntry`, it is a join record — not a field on `Game` or `User` — and is served through its own `WishlistDataService` / `WISHLIST_DATA` token (see [API Services Reference](reference-api-services.md#wishlistdataservice)), the same DI pattern used by every other data-backed feature.

*   **`id`** (`string`): Unique identifier for the entry.
*   **`userId`** (`string`): Foreign key referencing `User.id`.
*   **`gameId`** (`string`): Foreign key referencing `Game.id`.
*   **`addedAt`** (`string`): ISO timestamp set when the game was bookmarked.

Wishlisting a game has no effect on ownership or the download button's state — a wishlisted game that is also owned still shows the "Owned" download state, not anything wishlist-specific.

### Order

The `Order` model records a financial transaction for a paid game.

*   **`id`** (`string`): Unique identifier for the order.
*   **`userId`** (`string`): Foreign key referencing `User.id` (the buyer).
*   **`gameId`** (`string`): Foreign key referencing `Game.id` (the purchased game).
*   **`price`** (`number`): Snapshot of `Game.price` at the time of purchase, preserving the historical transaction cost regardless of future price changes. This field is named `price`, not `pricePaid`, to match the rest of the codebase.
*   **`status`** (`'confirmed'`): The current state of the order.
*   **`createdAt`** (`string`): ISO timestamp of the transaction.

## Game Form Validation Rules

When creating or editing a game in the Creator Studio, the following validation rules apply to the reactive form:

*   **`title`**: Required, length between 3 and 80 characters.
*   **`description`**: Required, length between 10 and 2000 characters.
*   **`tags`**: Requires 1 to 5 tags. Each individual tag must be 2 to 20 characters long (implemented via chip input).
*   **`price`**: Required, must be a number greater than or equal to 0, with a maximum of 2 decimal places.
*   **`coverImageUrl`**: Required, must be a valid URL.
*   **`screenshotUrls`**: Allows 0 to 6 URLs, each must be a valid URL.
*   **`samplePackageUrl`**: Required, must be a valid URL.

## Soft Delete Pattern

Instead of permanently removing records from the database, games use a soft-delete pattern. When a creator deletes a listing, the `deletedAt` field is populated with the current timestamp.

Soft-deleted games are excluded from the main catalog and search results. However, they remain in the system so that users who previously acquired the game retain it in their library. In the library view, the download button for a soft-deleted game enters an "Unavailable" state.

## Code Examples

**Example User Record**
```json
{
  "id": "usr_123",
  "email": "pixelartist99@nexora.io",
  "displayName": "PixelArtist99",
  "roles": ["buyer", "creator"],
  "createdAt": "2023-10-27T10:00:00Z"
}
```

**Example Wishlist Entry**
```json
{
  "id": "wsh_789",
  "userId": "usr_123",
  "gameId": "game_456",
  "addedAt": "2026-08-12T09:15:00Z"
}
```

**Example Game Record**
```json
{
  "id": "game_456",
  "ownerId": "usr_123",
  "title": "Neon Dash",
  "description": "A fast-paced synthwave platformer.",
  "tags": ["platformer", "action"],
  "price": 4.99,
  "coverImageUrl": "https://picsum.photos/seed/neondash/400/300",
  "screenshotUrls": ["https://picsum.photos/seed/neondash1/800/600"],
  "samplePackageUrl": "assets/sample-packages/neon-dash.zip",
  "createdAt": "2023-11-01T14:30:00Z",
  "updatedAt": "2023-11-01T14:30:00Z"
}
```

## Related Documentation

*   [How-to: Catalog and Game Detail](howto-catalog-detail.md)
*   [How-to: Data Layer Setup](howto-data-layer.md)
*   [How-to: Authentication System](howto-auth-system.md)
*   [API & Data Services Reference](reference-api-services.md) — see `WishlistDataService`
*   [Explanation: Dependency Injection Abstraction](explanation-di-abstraction.md)

# Data models reference

This document provides a complete reference for the TypeScript entity models used in NEXORA. It describes the `User`, `Game`, `LibraryEntry`, `WishlistEntry`, and `Order` interfaces, including field types, constraints, and validation schemas.

---

## Entity models

### User

The `User` model represents an authenticated account in the system.

* **`id`** (`string`): Unique identifier for the user.
* **`email`** (`string`): Email address used for authentication.
* **`displayName`** (`string`): Public display name.
* **`roles`** (`('buyer' | 'creator')[]`): Array of assigned roles for authorization.
* **`createdAt`** (`string`): ISO 8601 creation timestamp.

```typescript
export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: ('buyer' | 'creator')[];
  createdAt: string;
}
```

---

### Game

The `Game` model represents a product listing in the marketplace.

* **`id`** (`string`): Unique identifier for the game.
* **`ownerId`** (`string`): Foreign key referencing `User.id` (creator owner).
* **`title`** (`string`): Product title.
* **`description`** (`string`): Detailed description.
* **`tags`** (`string[]`): Category and genre tags.
* **`price`** (`number`): Cost in USD (`0` indicates a free game).
* **`coverImageUrl`** (`string`): Hero cover image URL.
* **`screenshotUrls`** (`string[]`): Array of preview screenshot URLs.
* **`samplePackageUrl`** (`string`): Relative or absolute path to static download asset.
* **`deletedAt`** (`string`, optional): ISO timestamp of soft deletion (absent for active games).
* **`createdAt`** (`string`): ISO 8601 creation timestamp.
* **`updatedAt`** (`string`): ISO 8601 update timestamp.

```typescript
export interface Game {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  coverImageUrl: string;
  screenshotUrls: string[];
  samplePackageUrl: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### LibraryEntry

The `LibraryEntry` model maps ownership between users and games.

* **`id`** (`string`): Unique identifier for the entry.
* **`userId`** (`string`): Foreign key referencing `User.id`.
* **`gameId`** (`string`): Foreign key referencing `Game.id`.
* **`acquiredAt`** (`string`): ISO timestamp of acquisition.
* **`orderId`** (`string`, optional): Foreign key referencing `Order.id` for paid purchases.

```typescript
export interface LibraryEntry {
  id: string;
  userId: string;
  gameId: string;
  acquiredAt: string;
  orderId?: string;
}
```

---

### WishlistEntry

The `WishlistEntry` model tracks saved games for an account.

* **`id`** (`string`): Unique identifier.
* **`userId`** (`string`): Foreign key referencing `User.id`.
* **`gameId`** (`string`): Foreign key referencing `Game.id`.
* **`addedAt`** (`string`): ISO timestamp when the game was saved.

```typescript
export interface WishlistEntry {
  id: string;
  userId: string;
  gameId: string;
  addedAt: string;
}
```

---

### Order

The `Order` model records transaction history for paid title acquisitions.

* **`id`** (`string`): Unique order identifier.
* **`userId`** (`string`): Foreign key referencing `User.id` (buyer).
* **`gameId`** (`string`): Foreign key referencing `Game.id`.
* **`price`** (`number`): Price snapshot at the time of purchase.
* **`status`** (`'confirmed'`): Transaction status.
* **`createdAt`** (`string`): ISO timestamp of the transaction.

```typescript
export interface Order {
  id: string;
  userId: string;
  gameId: string;
  price: number;
  status: 'confirmed';
  createdAt: string;
}
```

---

## Form validation rules

When creating or editing games in Creator Studio, the reactive form enforces the following constraints:

| Field | Type | Validation Constraints |
| :--- | :--- | :--- |
| `title` | String | Required, length between 3 and 80 characters. |
| `description` | String | Required, length between 10 and 2000 characters. |
| `tags` | Array | Required, 1 to 5 tags (each tag length 2 to 20 characters). |
| `price` | Number | Required, numeric $\ge 0$, maximum 2 decimal places. |
| `coverImageUrl` | String | Required, valid URL format. |
| `screenshotUrls` | Array | Optional, 0 to 6 valid image URLs. |
| `samplePackageUrl`| String | Required, valid file path or URL. |

---

## Soft-deletion pattern

NEXORA uses soft-deletion to preserve purchase history and user libraries:

1. When a creator removes a game, `deletedAt` is set to the current ISO timestamp.
2. Active catalog queries filter out records where `deletedAt` is present.
3. Users who already acquired the game retain their `LibraryEntry`, but the download button renders in a disabled **Unavailable** state.

---

## Related documentation

* [API & Data Services Reference](./reference-api-services.md)
* [How to Build Catalog and Game Detail Views](./howto-catalog-detail.md)
* [How to Implement the Creator Studio](./howto-creator-studio.md)

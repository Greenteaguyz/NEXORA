<!-- Generated: 2026-09-05 | Files scanned: 101 | Token estimate: ~700 -->
# NEXORA Data Models & LocalStore Persistence

## Core TypeScript Interfaces
- **Game** (`src/app/core/models/game.model.ts`):
  `{ id, title, slug, price, discountPercent, coverImage, screenshots, tags, genres, releaseDate, developer, publisher, systemRequirements, status: 'published' | 'draft' | 'archived' }`
- **User** (`src/app/core/models/user.model.ts`):
  `{ id, username, email, displayName, avatarUrl, bio, roles: ('buyer' | 'creator')[], createdAt }`
- **PaymentMethod** (`src/app/core/models/payment-method.model.ts`):
  `{ id, userId, type: 'card' | 'khqr' | 'wallet', cardBrand, last4, expiryMonth, expiryYear, isDefault }`
- **Order** (`src/app/core/models/order.model.ts`):
  `{ id, userId, gameId, gameTitle, gameCover, amount, currency, status, paymentMethodId, createdAt }`
- **LibraryEntry** (`src/app/core/models/library-entry.model.ts`):
  `{ id, userId, gameId, game, acquiredAt, playTimeMinutes, installStatus, lastPlayedAt }`

## Persistence Storage Keys (LocalStoreService)
```
auth_session_user ........... Active logged-in user object
auth_users .................. Master user registry
auth_credentials ............ Encrypted credential hashes & salts (isolated from User model)
auth_lockouts ............... Brute-force lockout state tracking per email
nexora_games ................ Catalog game entities
nexora_library_${userId} .... User-specific game ownership registry
nexora_wishlist_${userId} ... User-specific wishlisted game IDs
nexora_orders_${userId} ..... User-specific completed transactions
nexora_payments_${userId} ... User-specific saved payment methods and wallet balance
nexora_theme ................ Dual theme preference ('dark' | 'light')
nexora_lang ................. Active locale code ('en' | 'kh')
```

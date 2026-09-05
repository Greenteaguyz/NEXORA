<!-- Generated: 2026-09-05 | Files scanned: 101 | Token estimate: ~650 -->
# NEXORA Core Services & Business Logic

## Core Service Architecture
All mock services simulate realistic async latency, network error bounds, and reactive Signal stores.

### 1. AuthService & AuthMockService (`src/app/core/auth/`)
- Authenticate credentials with constant-time password hash comparison.
- Brute-force protection: Max 5 failed attempts -> 60-second cooldown timer.
- Persona switching: Reactively updates `currentUser()` between Alice (creator) and Bob (buyer).
- Return URL sanitization: `sanitizeReturnUrl` strips open-redirect vulnerabilities.

### 2. MockPaymentsDataService (`src/app/core/data/payments/`)
- `recordRevenueSplit(orderId, gameId, devId, totalUsd)`:
  - 90% allocated to game developer.
  - 10% allocated to platform escrow.
- Multi-persona validation: Enforces card-only top-up for buyers; KHQR payouts reserved for creators.
- Gift Voucher processing: Auto-dashing formatter (`XXXX-XXXX-XXXX-XXXX`) with balance credit.

### 3. MockGamesDataService (`src/app/core/data/games/`)
- Full CRUD for games with draft autosave and 30-day soft-delete recycle bin.
- Publish readiness evaluator: Ensures mandatory fields, cover art, tags, and specs before go-live.

### 4. TranslationService (`src/app/core/services/`)
- In-memory dictionary cache with dynamic `import('./i18n/kh')` lazy-loading.
- 1:1 key parity verified across 200 keys between `en.ts` and `kh.ts`.

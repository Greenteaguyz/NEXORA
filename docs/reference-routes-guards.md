# Routes & guards reference

This document defines the routing configuration, route guard execution hierarchy, authorization matrix, and deep-linked `returnUrl` behavior in NEXORA.

---

## Route table

The following table lists all application routes, associated feature components, applied guards, and role permissions:

| Path | Feature | Guard(s) | Required Role |
| :--- | :--- | :--- | :--- |
| `/` | Game Catalog | None (redirects to `/catalog`) | Public |
| `/catalog` | Game Catalog | None | Public |
| `/genres` | Genres Explorer | None | Public |
| `/games/:id` | Game Detail | None | Public |
| `/creators/:id` | Creator Profile | None | Public |
| `/login` | Authentication | None | Public |
| `/register` | Authentication | None | Public |
| `/forgot-password` | Authentication | None | Public |
| `/library` | User Library | `authGuard` | Authenticated account |
| `/wishlist` | Wishlist | `authGuard` | Authenticated account |
| `/orders` | Order History | `authGuard` | Authenticated account |
| `/profile` | User Profile | `authGuard` | Authenticated account |
| `/account/payment` | Payment & Wallet | `authGuard` | Authenticated account |
| `/studio` | Creator Studio | `authGuard`, `roleGuard('creator')` | Creator |
| `/studio/games/new` | Creator Studio | `authGuard`, `roleGuard('creator')`, `canDeactivate(unsavedChangesGuard)` | Creator |
| `/studio/games/:id/edit`| Creator Studio | `authGuard`, `roleGuard('creator')`, `ownershipGuard`, `canDeactivate(unsavedChangesGuard)` | Creator (owner only) |
| `/support` | Support | None | Public |
| `/not-found` | Not Found | None | Public |
| `**` | Not Found | None (redirects to `/not-found`) | Public |

**Note:** `/studio/games/new` requires `authGuard` and `roleGuard('creator')`. `ownershipGuard` is attached to `/studio/games/:id/edit` to ensure creators can only edit listings where `game.ownerId === currentUser.id`. Both studio form routes attach `unsavedChangesGuard`.

---

## Functional route guards

NEXORA implements four functional guards:

### authGuard (`src/app/core/auth/auth.guard.ts`)

Protects private member routes (`/library`, `/wishlist`, `/orders`, `/profile`, `/account/payment`, `/studio`) from anonymous access:
* **Allowed**: User session exists (`currentUser() !== null`).
* **Redirect**: Anonymous users are redirected to `/login?returnUrl=<SANITIZED_PATH>&reason=auth-required`.

### roleGuard(requiredRole: 'buyer' | 'creator') (`src/app/core/auth/role.guard.ts`)

Validates role-specific access for creator-exclusive routes:
* **Allowed**: Authenticated user's `roles` array contains `requiredRole`.
* **Redirect**: Users lacking the role are redirected to `/catalog?reason=creator-required`.

### ownershipGuard (`src/app/core/auth/ownership.guard.ts`)

Prevents creators from modifying game listings owned by another creator:
* **Allowed**: Current user `id === game.ownerId`.
* **Redirect**: Unauthorized users are redirected to `/studio?reason=not-owner`.

### unsavedChangesGuard (`src/app/features/creator-studio/game-form/unsaved-changes.guard.ts`)

`CanDeactivateFn` protecting creators from accidentally discarding draft listing changes:
* **Allowed**: Form is pristine, save operation just completed, or user confirms navigation dialog.
* **Prompt**: Browser native confirmation dialog if form is dirty and uncommitted.

---

## Authorization matrix

| Action | Anonymous | Buyer | Creator (Own Listing) | Creator (Other Listing) |
| :--- | :--- | :--- | :--- | :--- |
| **Browse catalog** | Allowed | Allowed | Allowed | Allowed |
| **View game detail** | Allowed | Allowed | Allowed | Allowed |
| **Download free game** | Redirects to `/login` | Allowed | Allowed | Allowed |
| **Purchase & download paid game** | Redirects to `/login` | Allowed (modal) | Allowed (modal) | Allowed (modal) |
| **Access library** | Redirects to `/login` | Allowed | Allowed | Allowed |
| **Manage payment & wallet** | Redirects to `/login` | Allowed | Allowed | Allowed |
| **Access Creator Studio** | Redirects to `/login` | Redirects to `/catalog` | Allowed | Allowed |
| **Publish new game** | Redirects to `/login` | Redirects to `/catalog` | Allowed | Allowed |
| **Edit / delete listing** | Redirects to `/login` | Redirects to `/catalog` | Allowed | Redirects to `/studio` |

---

## Return URL sanitization & guard feedback

When an unauthorized navigation occurs, NEXORA captures the target destination and reasons:

### 1. URL Sanitization (`sanitizeReturnUrl`)
To protect against open redirect vulnerabilities, `sanitizeReturnUrl` enforces:
* Disallows protocol schemes (`http:`, `https:`, `javascript:`).
* Strips protocol-relative paths (`//malicious.com`).
* Replaces backslashes with forward slashes.
* Falls back to `/catalog` if path is non-relative or invalid.

### 2. Guard Rejection Reasons (`?reason=`)
The root `AppComponent` monitors routing events and displays contextual toast feedback before stripping the query parameter via `replaceUrl: true`:

| Reason Code | Toast Severity | User Feedback Message |
| :--- | :--- | :--- |
| `auth-required` | Info | "Sign in to access that page." |
| `creator-required`| Warning | "Creator permissions required." |
| `not-owner` | Error | "You can only edit games you own." |
| `game-not-found` | Warning | "The requested game could not be found." |

### 3. Intent Deep Links (`?intent=`)
Game detail links support direct purchase or download triggers via query params:
* `/games/:id?intent=purchase`: Automatically launches the `PurchaseConfirmModalComponent` on entry.
* `/games/:id?intent=download`: Automatically initiates the download sequence via `DownloadService`.
* Upon activation, `GameDetailComponent` cleanly strips the `?intent` parameter to avoid re-triggering on manual refresh.

---

## Related documentation

* [How to Set Up the Auth & Guard System](./howto-auth-system.md)
* [Architecture of the Gated Download Flow](./explanation-download-flow.md)
* [Tutorial: Implementing the Gated Download Flow](./tutorial-download-flow.md)

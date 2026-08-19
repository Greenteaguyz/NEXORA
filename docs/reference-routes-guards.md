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
| `/studio` | Creator Studio | `authGuard`, `roleGuard('creator')` | Creator |
| `/studio/games/new` | Creator Studio | `authGuard`, `roleGuard('creator')` | Creator |
| `/studio/games/:id/edit`| Creator Studio | `authGuard`, `roleGuard('creator')`, `ownershipGuard` | Creator (owner only) |
| `/support` | Support | None | Public |
| `/not-found` | Not Found | None | Public |
| `**` | Not Found | None (redirects to `/not-found`) | Public |

**Note:** `/studio/games/new` requires `authGuard` and `roleGuard('creator')` only. `ownershipGuard` is not attached because no game ID exists prior to initial submission.

---

## Functional route guards

NEXORA implements three functional `CanActivateFn` guards in `src/app/core/auth/`:

### authGuard

Protects private member routes from unauthenticated access:
* **Allowed**: User session exists (`currentUser() !== null`).
* **Redirect**: Anonymous users are redirected to `/login?returnUrl=<ATTEMPTED_PATH>`.

### roleGuard(requiredRole: 'buyer' | 'creator')

Validates role-specific access (e.g., Creator Studio):
* **Allowed**: Authenticated user's `roles` array contains `requiredRole`.
* **Redirect**: Users lacking the role are redirected to `/catalog`.

### ownershipGuard

Prevents creators from modifying game listings owned by another user:
* **Allowed**: Current user `id === game.ownerId`.
* **Redirect**: Unauthorized users are redirected to `/studio`.

---

## Authorization matrix

| Action | Anonymous | Buyer | Creator (Own Listing) | Creator (Other Listing) |
| :--- | :--- | :--- | :--- | :--- |
| **Browse catalog** | Allowed | Allowed | Allowed | Allowed |
| **View game detail** | Allowed | Allowed | Allowed | Allowed |
| **Download free game** | Redirects to `/login` | Allowed | Allowed | Allowed |
| **Purchase & download paid game** | Redirects to `/login` | Allowed (modal) | Allowed (modal) | Allowed (modal) |
| **Access library** | Redirects to `/login` | Allowed | Allowed | Allowed |
| **Access Creator Studio** | Redirects to `/login` | Redirects to `/catalog` | Allowed | Allowed |
| **Publish new game** | Redirects to `/login` | Redirects to `/catalog` | Allowed | Allowed |
| **Edit / delete listing** | Redirects to `/login` | Redirects to `/catalog` | Allowed | Redirects to `/studio` |

---

## Return URL workflow

When an anonymous user triggers a protected action, NEXORA captures the target path to restore user flow after login:

1. `authGuard` intercepts the navigation request.
2. The user is redirected to `/login?returnUrl=/target-path`.
3. Upon login, `LoginComponent` parses `returnUrl` from `ActivatedRoute.queryParams`.
4. The router navigates directly to `returnUrl`, falling back to `/catalog` if omitted.

---

## Related documentation

* [How to Set Up the Auth & Guard System](./howto-auth-system.md)
* [Architecture of the Gated Download Flow](./explanation-download-flow.md)
* [Tutorial: Implementing the Gated Download Flow](./tutorial-download-flow.md)

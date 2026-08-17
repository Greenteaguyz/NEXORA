This document covers the routing configuration, route guards, and authorization matrix for **NEXORA**. It defines the route table, details the behavior of the `authGuard`, `roleGuard`, and `ownershipGuard`, and explains the return URL flow used to redirect users back to their intended destination after authentication.

## Route Table

The application uses the following route structure. Each route dictates the required feature, the applied guards, and the necessary user role.

| Path                     | Feature        | Guard(s)                                             | Role required              |
|--------------------------|----------------|------------------------------------------------------|----------------------------|
| `/`                      | game-catalog   | none (redirects to `/catalog`)                       | —                          |
| `/catalog`               | game-catalog   | none                                                 | —                          |
| `/genres`                | genres         | none                                                 | —                          |
| `/games/:id`             | game-detail    | none                                                 | —                          |
| `/creators/:id`          | creator-profile| none                                                 | —                          |
| `/login`                 | auth           | none                                                 | —                          |
| `/register`              | auth           | none                                                 | —                          |
| `/forgot-password`       | auth           | none                                                 | —                          |
| `/library`               | library        | `authGuard`                                          | any authenticated user     |
| `/wishlist`              | wishlist       | `authGuard`                                          | any authenticated user     |
| `/orders`                | orders         | `authGuard`                                          | any authenticated user     |
| `/profile`               | profile        | `authGuard`                                          | any authenticated user     |
| `/studio`                | creator-studio | `authGuard`, `roleGuard('creator')`                  | creator                    |
| `/studio/games/new`      | creator-studio | `authGuard`, `roleGuard('creator')`                  | creator                    |
| `/studio/games/:id/edit` | creator-studio | `authGuard`, `roleGuard('creator')`, `ownershipGuard` | creator (own listing only) |
| `/support`               | support        | none                                                 | —                          |
| `/not-found`             | not-found      | none                                                 | —                          |
| `**`                     | not-found      | none (wildcard redirect to `/not-found`)             | —                          |

Note that `/studio/games/new` only requires `authGuard` and `roleGuard('creator')` — `ownershipGuard` does not apply because there is no existing game record to check ownership against until the form is submitted.

## Route Guards

The application implements three functional route guards to enforce the authorization matrix.

### `authGuard`

Ensures that a user is authenticated before accessing a route.

*   **Behavior**: If the user is logged in, allows navigation.
*   **Redirect**: If anonymous, redirects the user to `/login`. It appends a `returnUrl` query parameter capturing the route the user attempted to access.

### `roleGuard(role: string)`

A factory function that returns a guard verifying if the authenticated user possesses a specific role.

*   **Behavior**: Checks the `roles` array on the current `User` object. If the specified role is present, allows navigation.
*   **Redirect**: If the user lacks the required role, redirects to `/catalog`.
*   **Prerequisite**: Should always be placed after `authGuard` in the route configuration.

### `ownershipGuard`

Prevents creators from editing game listings they do not own.

*   **Behavior**: Inspects the `:id` route parameter, fetches the corresponding game, and compares the `Game.ownerId` against the currently authenticated user's ID. Allows navigation if they match.
*   **Redirect**: If the user is not the owner, redirects to `/catalog`.
*   **Prerequisite**: Should follow `authGuard` and `roleGuard`.

## Authorization Matrix

The following matrix defines which actions are permitted based on the user's authentication status and roles.

| Action                          | Anonymous              | Buyer              | Creator (own listing) | Creator (others' listing) |
|---------------------------------|------------------------|--------------------|-----------------------|---------------------------|
| Browse catalog                  | ✅                     | ✅                 | ✅                    | ✅                        |
| View game detail                | ✅                     | ✅                 | ✅                    | ✅                        |
| Download a free game            | ❌ (redirect to login) | ✅                 | ✅                    | ✅                        |
| Purchase + download a paid game | ❌ (redirect to login) | ✅ (confirm step)  | ✅ (confirm step)     | ✅ (confirm step)         |
| View library                    | ❌                     | ✅                 | ✅                    | ✅                        |
| Create listing                  | ❌                     | ❌                 | ✅                    | —                         |
| Edit listing                    | ❌                     | ❌                 | ✅                    | ❌                        |
| Delete listing                  | ❌                     | ❌                 | ✅                    | ❌                        |

## Return URL Flow

To improve user experience, actions that require authentication (like attempting to download a game while anonymous or navigating directly to `/library`) utilize a return URL flow.

1.  The `authGuard` or component intercepts the action.
2.  The user is redirected to `/login?returnUrl=/previous-path`.
3.  Upon successful authentication, the login component reads the `returnUrl` query parameter.
4.  The router navigates the user to the parsed `returnUrl`, falling back to `/catalog` if absent.

## Code Examples

**Applying Guards in Route Configuration**
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { 
    path: 'library', 
    component: LibraryComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'studio', 
    component: StudioComponent,
    canActivate: [authGuard, roleGuard('creator')] 
  }
];
```

**authGuard Implementation (Simplified)**
```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }
  
  return router.createUrlTree(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
};
```

## Related Documentation

*   [How-to: Authentication System](howto-auth-system.md)
*   [Tutorial: Download Flow](tutorial-download-flow.md)
*   [Explanation: Download Flow](explanation-download-flow.md)

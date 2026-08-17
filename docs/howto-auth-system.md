# How to set up the auth system

This guide explains how to set up the authentication and authorization system for **NEXORA**. For context on route protection, see the [Routes and Guards Reference](reference-routes-guards.md). For getting started, see the [Getting Started Tutorial](tutorial-getting-started.md).

## Prerequisites

- A `core/auth/` folder to contain auth-related logic.
- An `AuthService` interface defined.
- The persistence layer configured (e.g., IndexedDB/localStorage).

## Steps

### 1. Create AuthService with Signals

Implement the `AuthService` using Angular signals to store the current user state. This allows components to reactively update when the user logs in or out.

```typescript
@Injectable({ providedIn: 'root' })
export class MockAuthService implements AuthService {
  private currentUserSignal = signal<User | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();
  // ...
}
```

### 2. Implement the Mock Auth Logic

Create `auth.mock.ts`. The mock login checks the email against the seeded users in `UsersDataService`. It ignores the password entirely. Display demo account pills (`alice@nexora.io`, `bob@nexora.io`, `carol@nexora.io`) on the login screen to help users find the demo accounts.

### 3. Create the authGuard

Create `authGuard` to protect private routes. If the user is not authenticated, redirect them to the login page and pass the requested URL in a `returnUrl` query parameter.

### 4. Create the roleGuard

Create `roleGuard` to protect routes that require specific roles (like the creator studio). Check the `roles` array on the user object (`roles: ('buyer' | 'creator')[]`). If a buyer attempts to access a creator route, redirect them to `/catalog`.

### 5. Create the ownershipGuard

Create `ownershipGuard` to protect creator edit routes. Inject the `GAMES_DATA` InjectionToken. Check if the current user ID matches the game's `ownerId`. If not, redirect or show an error.

### 6. Wire the Registration & Social Auth Form

Build the auth form that supports:
1. Standard email, password, and the "I want to publish games (Creator Studio)" toggle.
2. **Google & Apple Social Sign-In buttons** styled as clean outline action buttons using inline SVG vector icons (no PNG image files).
3. Clicking Google or Apple simulates an OAuth authentication handshake, auto-hydrates the mock session in `AuthService`, and redirects the user to their `returnUrl`.

## Verification

1. Start the application.
2. Log in using a seeded buyer email (e.g., `bob@nexora.io`).
3. Verify the navigation bar updates to show buyer-specific links.
4. Try accessing `/studio` directly in the URL bar. Verify it redirects you to the catalog.

## Troubleshooting

- **`returnUrl` not working:** Check that the `authGuard` properly reads the `RouterStateSnapshot.url` and passes it to `createUrlTree`.
- **Role mismatch after login:** Ensure the mock login function properly sets the user object in the signal and that local storage correctly persists the `roles` array.

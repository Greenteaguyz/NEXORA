# How to set up the authentication and guard system

This guide explains how to configure the authentication and authorization system in NEXORA using Angular Signals and functional router guards.

For routing configuration details, see the [Routes & Guards Reference](./reference-routes-guards.md).

---

## Before you begin

Verify that you have:
* Created the `src/app/core/auth/` directory.
* Defined the `User` model interface in `src/app/core/models/user.model.ts`.
* Configured local state persistence in `LocalStoreService`.

---

## Procedure

### 1. Create AuthService using Angular Signals

Implement `AuthService` with a private writable signal and public readonly signal for reactive user state:

```typescript
@Injectable({ providedIn: 'root' })
export class MockAuthService implements AuthService {
  private currentUserSignal = signal<User | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();
  // ...
}
```

### 2. Implement the mock authentication provider

Create `src/app/core/auth/auth.mock.ts`. The mock authentication provider verifies emails against seeded users in `UsersDataService`. Display demo account pills (`alice@nexora.io`, `bob@nexora.io`, `carol@nexora.io`) on the login screen to allow single-click login during testing.

### 3. Create the authGuard

Create `src/app/core/auth/auth.guard.ts` to protect private routes. If a user is unauthenticated, redirect them to `/login` and pass the attempted URL in the `returnUrl` query parameter:

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

### 4. Create the roleGuard

Create `roleGuard` to restrict access to creator routes such as Creator Studio. Verify that `currentUser().roles` contains `'creator'`. If an unauthorized buyer accesses the route, redirect them to `/catalog`.

### 5. Create the ownershipGuard

Create `ownershipGuard` to protect creator edit routes. Inject the `GAMES_DATA` injection token, retrieve the game ID from route params, and verify that `currentUser().id === game.ownerId`. If the IDs do not match, redirect to `/studio`.

### 6. Wire registration and social authentication

Configure the registration component:
1. Provide form fields for email, password, and the **I want to publish games (Creator Studio)** toggle.
2. Add **Google** and **Apple** social sign-in buttons with inline SVG icons.
3. Simulate OAuth authentication on click, auto-hydrate the mock user session in `AuthService`, and redirect to `returnUrl`.

---

## Verify your configuration

1. Start the development server using `npm start`.
2. Sign in using a buyer account (`bob@nexora.io`).
3. Verify that the navigation header updates to show buyer links.
4. Navigate manually to `/studio` in your browser address bar.
5. Verify that the router redirects you to `/catalog`.

---

## Troubleshooting

* **`returnUrl` is not preserved:** Verify that `authGuard` extracts `state.url` from `RouterStateSnapshot` and includes it in `createUrlTree`.
* **Role mismatch after login:** Ensure that `currentUserSignal.set(user)` executes properly and that `LocalStoreService` persists the `roles` array.

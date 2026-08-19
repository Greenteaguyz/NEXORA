# How to add and swap data services via DI

This guide explains how to add a data service to NEXORA using Angular Dependency Injection (DI) tokens. This pattern allows swapping mock implementations for live HTTP APIs without modifying UI components.

For the architectural rationale behind this design, see [Why We Use a Dependency Injection Abstraction Layer](./explanation-di-abstraction.md).

---

## Procedure

### 1. Define the service interface

Create a TypeScript interface that defines the contract and method signatures for the service:

```typescript
export interface GamesDataService {
  getGames(): Observable<Game[]>;
  getGameById(id: string): Observable<Game | null>;
  createGame(game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Observable<Game>;
}
```

### 2. Create the InjectionToken

In `src/app/core/data/tokens.ts`, define an `InjectionToken` typed to the interface:

```typescript
import { InjectionToken } from '@angular/core';

export const GAMES_DATA = new InjectionToken<GamesDataService>('GAMES_DATA');
```

### 3. Implement the mock service class

Create an `@Injectable` class implementing the interface. Simulate network latency using RxJS operators and synchronize state mutations with `LocalStoreService`:

```typescript
@Injectable({ providedIn: 'root' })
export class MockGamesDataService implements GamesDataService {
  private localStore = inject(LocalStoreService);

  getGames(): Observable<Game[]> {
    return of(this.localStore.getGames()).pipe(delay(150));
  }
}
```

### 4. Register the provider in application config

In `src/app/app.config.ts`, bind the `InjectionToken` to your mock service class in the `providers` array:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: GAMES_DATA, useClass: MockGamesDataService }
  ]
};
```

### 5. Inject the token in components

Inject the token in components or services using Angular's `inject()` function:

```typescript
@Component({
  selector: 'app-catalog',
  standalone: true,
  template: `...`
})
export class CatalogComponent {
  private gamesData = inject(GAMES_DATA);
  games = toSignal(this.gamesData.getGames(), { initialValue: [] });
}
```

---

## Swap mock services for live HTTP services

To switch from the mock data service to a production HTTP backend, update the provider binding in `src/app/app.config.ts`:

```diff
 providers: [
-  { provide: GAMES_DATA, useClass: MockGamesDataService }
+  { provide: GAMES_DATA, useClass: HttpGamesDataService }
 ]
```

No changes are required in feature components, tests, or routing modules.

---

## Verification

1. Start the application using `npm start`.
2. Open your browser to [`http://localhost:4200/catalog`](http://localhost:4200/catalog).
3. Verify that games load and render properly after the simulated network delay.
4. Add or update a game in the Creator Studio, refresh the page, and confirm the changes persist.

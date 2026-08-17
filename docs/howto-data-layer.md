# How to add a new data service

This guide shows how to add a new mock data service to the application using the Dependency Injection (DI) abstraction layer. For more on the architecture, read the [DI Abstraction Explanation](explanation-di-abstraction.md). For data structure details, refer to the [Data Models Reference](reference-data-models.md).

## Steps

### 1. Define the Interface

Create a TypeScript interface describing the methods the service will expose.

```typescript
export interface GamesDataService {
  getGames(): Observable<Game[]>;
  getGame(id: string): Observable<Game>;
  // ...
}
```

### 2. Create the InjectionToken

In `tokens.ts`, define an `InjectionToken` for the service interface. This token decouples components from the concrete implementation.

```typescript
export const GAMES_DATA = new InjectionToken<GamesDataService>('GAMES_DATA');
```

### 3. Implement the Mock Class

Create a class that implements the interface. Use an in-memory array for data, IndexedDB or localStorage for persistence, and add simulated latency to mimic network requests.

```typescript
@Injectable()
export class MockGamesDataService implements GamesDataService {
  // Use RxJS timer or delay to simulate latency
  // Sync state to IndexedDB/localStorage on mutation
}
```

### 4. Register the Provider

In `app.config.ts`, bind the token to the mock implementation using the `providers` array.

```typescript
providers: [
  { provide: GAMES_DATA, useClass: MockGamesDataService }
]
```

### 5. Inject the Token

In your feature component, inject the token instead of the class.

```typescript
export class CatalogComponent {
  private gamesData = inject(GAMES_DATA);
}
```

## The Mock-to-HTTP Swap

When you need to switch from the mock backend to a real HTTP backend, you only change one line in `app.config.ts`:

```diff
 providers: [
-  { provide: GAMES_DATA, useClass: MockGamesDataService }
+  { provide: GAMES_DATA, useClass: HttpGamesDataService }
 ]
```

All components remain untouched.

## Verification

1. Inject the new service into a component.
2. Call a method that returns data.
3. Observe the simulated latency before the data renders.
4. Modify the data (e.g., via a form), refresh the page, and verify the changes persisted.

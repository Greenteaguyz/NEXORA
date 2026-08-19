# Why We Use a Dependency Injection Abstraction Layer

This document explains the architectural rationale behind the data service abstraction layer in NEXORA.

For step-by-step instructions on implementing services with this pattern, see [How to Add and Swap Data Services via DI](./howto-data-layer.md).

---

## The architectural challenge

NEXORA is designed as a fully functional standalone frontend prototype that runs entirely in the browser without an active backend server. 

Directly coupling UI components to mock data creates technical debt: when a production backend is introduced, every component requiring data fetching would need modifications.

---

## The solution: Interface-driven InjectionTokens

NEXORA decouples UI components from concrete data implementations using TypeScript interfaces and Angular `InjectionToken` definitions. Components depend solely on the token contract:

```
┌───────────────────┐        ┌──────────────────┐        ┌─────────────────────────┐
│ Feature Component │ ────►  │  InjectionToken  │  ◄──── │ MockGamesDataService    │
└───────────────────┘        └──────────────────┘        └─────────────────────────┘
                                       ▲
                                       │
                             ┌─────────────────────────┐
                             │ HttpGamesDataService    │
                             └─────────────────────────┘
```

### Architectural benefits

1. **Zero component modification**: Swapping mock services for live HTTP services requires updating only the provider definition in `src/app/app.config.ts`.
2. **Simplified unit testing**: Test suites inject lightweight stub implementations into components without spinning up HTTP interceptors or mock servers.
3. **Decoupled data contracts**: Backend schema changes are isolated to service adapter implementations.

---

## Architectural trade-offs

| Factor | Trade-off |
| :--- | :--- |
| **Initial setup overhead** | Requires declaring interfaces, token constants, and provider bindings upfront. |
| **Long-term flexibility** | Eliminates refactoring costs when migrating to REST or GraphQL APIs in production. |

---

## Related documentation

* [How to Add and Swap Data Services via DI](./howto-data-layer.md)
* [API & Data Services Reference](./reference-api-services.md)
* [Data Models Reference](./reference-data-models.md)

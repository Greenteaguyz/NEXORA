# Explanation: DI Abstraction Layer

This document explains why **NEXORA** uses an abstraction layer for its data services. Read the [How to add a new data service](howto-data-layer.md) guide for implementation details.

## The Problem

The capstone project is a frontend-only prototype. It needs to function completely in the browser without a real backend API. However, building components that directly couple to mock data logic creates massive technical debt. If the prototype succeeds and becomes a real application, developers would need to rewrite every component that fetches data.

## The Approach

We use interface-driven services and Angular `InjectionTokens` to decouple components from data sources. Components inject a token, not a class. We provide a mock implementation in the root configuration.

```text
+-------------------+       +-------------------+       +-----------------------+
|  Feature Component| ----> |  InjectionToken   | <---- | MockDataService (Impl)|
+-------------------+       +-------------------+       +-----------------------+
                                        ^
                                        |
                                +-----------------------+
                                | HTTPDataService (Impl)|
                                +-----------------------+
```

## The Trade-off

Setting up interfaces and tokens takes about two hours of upfront work. The benefit is a zero-touch backend swap later. When the HTTP API is ready, we swap the provider in `app.config.ts`. The components never know the difference.

## Why It Matters for the Capstone

This pattern demonstrates architectural maturity. It shows an understanding of enterprise Angular patterns and dependency inversion. It serves as an excellent talking point for a grading panel defense, highlighting forward-thinking design rather than just making a screen look nice.

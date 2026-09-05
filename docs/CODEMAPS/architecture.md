<!-- Generated: 2026-09-05 | Files scanned: 101 | Token estimate: ~750 -->
# NEXORA System Architecture

## Overview
Desktop-grade Steam-inspired storefront and creator platform built with Angular 18 (Standalone, OnPush, Signals, @if/@for).

```
[ User Viewports ]
       │
       ▼
[ Header Shell ] ──► [ Language Switcher (en / kh) ] ──► [ TranslationService (Lazy Chunks) ]
       │         ──► [ Theme Switcher (dark / light) ] ──► [ CSS Custom Properties ]
       ▼
[ Angular Router ] ──► Guards: authGuard · roleGuard · ownershipGuard · unsavedChangesGuard
       │
  ┌────┴──────────────────────────┬─────────────────────────────┐
  ▼                               ▼                             ▼
[ Storefront & Discovery ]   [ Checkout & Accounts ]     [ Creator Studio ]
  ├── GameCatalog              ├── PurchaseConfirmModal     ├── CreatorStudio
  ├── GameDetail               ├── Orders / Wishlist        └── GameForm (3-Step Wizard)
  └── Genres                   ├── AccountPayment (Wallet)
                               └── Profile (Security & PW)
       │                                  │                     │
       └──────────────────────────────────┼─────────────────────┘
                                          ▼
                      [ Core Reactive Services & Stores ]
                        ├── AuthService (signal<User | null>)
                        ├── MockGamesDataService
                        ├── MockPaymentsDataService (90/10 Split)
                        ├── ToastService (Cap 3, Dedupe, Hover)
                        └── LocalStoreService (Multi-Persona Vault)
```

## Core Subsystems & Service Boundaries
- **Auth & Persona Vault**: `AuthService` manages `currentUser` signal with multi-persona isolation (Alice Vance = Creator, Bob Mercer = Consumer).
- **Storefront Engine**: Reactive catalog filtering via `applyFilters()`, instant tag matching, O(1) Map lookups for games by ID.
- **Transaction Pipeline**: Neutral purchase confirmation modal (0 auto-selection default), 90% creator / 10% platform revenue split engine, instant library ownership.
- **Creator Studio**: 3-step game wizard (`game-form.component`), client-side drafts autosave, 30-day recycle bin, unsaved changes guard.
- **I18n Localization Engine**: `TranslationService` with 100% dictionary parity (200 keys each in English and Khmer), on-demand lazy loading of `kh.ts` (23.9 kB isolated chunk).
- **Anti-Slop Visual System**: WCAG AAA compliant dual themes (dark/light), grounded hover (0px translateY), strict font stack ordering (Latin precedes Khmer).

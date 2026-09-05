<!-- Generated: 2026-09-05 | Files scanned: 101 | Token estimate: ~850 -->
# NEXORA Frontend Component & Route Hierarchy

## Page Tree & Route Mapping
```
/ (redirects to /catalog)
├── /catalog ........................ GameCatalogComponent (Filters, Tags, Sort, Grid)
├── /genres ......................... GenresComponent (Categories, Tags, Hero CTA)
├── /games/:id ...................... GameDetailComponent (Media, Specs, Buy, Wishlist)
├── /creators/:id .................. CreatorProfileComponent (Creator Bio, Published Games)
├── /login .......................... LoginComponent (Credentials, Social Sign-In)
├── /register ....................... RegisterComponent (Account Creation)
├── /forgot-password ................ ForgotPasswordComponent (Reset Email Flow)
├── /library [authGuard] ............ LibraryComponent (Owned Games, Launch/Install, Playtime)
├── /wishlist [authGuard] ........... WishlistComponent (Saved Games, Price Alerts, Buy)
├── /orders [authGuard] ............. OrdersComponent (Receipt History, Invoices)
├── /profile [authGuard] ............ ProfileComponent (Personas, Stats, Account Password)
├── /account/payment [authGuard] .... AccountPaymentComponent (Wallet, Gift Cards, Cards)
├── /studio [authGuard, roleGuard] .. CreatorStudioComponent (Drafts, Published, Recycle Bin)
├── /studio/games/new ............... GameFormComponent (Step 1: Info -> Step 2: Media -> Step 3: Specs)
├── /studio/games/:id/edit .......... GameFormComponent [ownershipGuard, unsavedChangesGuard]
└── /support ........................ SupportComponent (FAQ, Help Desk)
```

## Key Shared UI Components & Directives
- **Shell**: `HeaderComponent` (Breadcrumbs, persona indicator, language toggle, theme toggle, logout modal).
- **Modals**:
  - `PurchaseConfirmModalComponent` (Neutral checkout, card/wallet selector, 90/10 split trigger).
  - `AddPaymentMethodFormComponent` (Card number grouping, expiry validation, CVV mask, creator-only KHQR).
- **Directives**:
  - `ScrollLockDirective` (Ref-counted body scroll lock preventing background jitter on open dialogs).
  - `CardNumberDirective` (Automatic 4-digit card formatting: 0000 0000 0000 0000).
  - `CvvDirective` (Strict 3-4 digit CVV input control).
- **Feedback**:
  - `ToastComponent` (Queue cap 3, duplicate toast suppression, pause on hover, action button support).
  - `LoadingSpinnerComponent` (Minimal, GPU-accelerated CSS spinner).
  - `EmptyStateComponent` (Grounded zero-state illustration and CTA).

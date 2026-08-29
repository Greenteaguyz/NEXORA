# Site Architecture — NEXORA

A complete map of every page, route, component, guard, and data dependency in the **NEXORA** application.

---

## Site Map

```mermaid
graph TD
    ROOT["/ redirect"]
    CATALOG["/catalog"]
    GENRES["/genres"]
    DETAIL["/games/:id"]
    CREATOR["/creators/:id"]
    LOGIN["/login"]
    REGISTER["/register"]
    FORGOT["/forgot-password"]
    LIBRARY["/library"]
    WISHLIST["/wishlist"]
    ORDERS["/orders"]
    PROFILE["/profile"]
    PAYMENT["/account/payment"]
    STUDIO["/studio"]
    STUDIO_NEW["/studio/games/new"]
    STUDIO_EDIT["/studio/games/:id/edit"]
    SUPPORT["/support"]
    NOTFOUND["/not-found (404)"]

    ROOT --> CATALOG
    CATALOG -->|"Browse by Genre"| GENRES
    GENRES -->|"Select Genre tag"| CATALOG
    CATALOG -->|"Click game card"| DETAIL
    DETAIL -->|"Click Creator Name"| CREATOR
    CREATOR -->|"Click Game"| DETAIL
    DETAIL -->|"Download click<br/>anonymous"| LOGIN
    LOGIN -->|"returnUrl"| DETAIL
    LOGIN <--> REGISTER
    LOGIN <--> FORGOT
    LOGIN -->|"authenticated"| LIBRARY
    LOGIN -->|"authenticated"| WISHLIST
    LOGIN -->|"authenticated"| ORDERS
    LOGIN -->|"authenticated"| PROFILE
    LOGIN -->|"authenticated"| PAYMENT
    PROFILE <--> PAYMENT
    LOGIN -->|"creator role"| STUDIO
    LIBRARY -->|"Click game"| DETAIL
    WISHLIST -->|"Click game"| DETAIL
    ORDERS -->|"Click game"| DETAIL
    STUDIO --> STUDIO_NEW
    STUDIO --> STUDIO_EDIT

    %% VISUAL ROUTE CLASSIFICATION STYLING
    classDef public fill:#EFF6FF,stroke:#2563EB,stroke-width:2px,color:#1E40AF;
    classDef auth fill:#ECFDF5,stroke:#059669,stroke-width:2px,color:#065F46;
    classDef stretch fill:#FEF3C7,stroke:#D97706,stroke-width:2px,color:#92400E;

    class ROOT,CATALOG,GENRES,DETAIL,CREATOR,FORGOT,SUPPORT,NOTFOUND public
    class LOGIN,REGISTER,LIBRARY,WISHLIST,ORDERS,PROFILE,PAYMENT auth
    class STUDIO,STUDIO_NEW,STUDIO_EDIT stretch
```

> **Legend:** 🔵 Public routes — 🟢 Auth-required routes — 🟠 Creator / stretch goal routes

---

## Route Table

| Route                   | Page              | Guard(s)                                                                                    | Role              | Component                 |
|-------------------------|-------------------|---------------------------------------------------------------------------------------------|-------------------|---------------------------|
| `/`                     | Redirect          | —                                                                                           | —                 | Redirects to `/catalog`   |
| `/catalog`              | Game Catalog      | None                                                                                        | Public            | `GameCatalogComponent`    |
| `/genres`               | Genre Directory   | None                                                                                        | Public            | `GenreDirectoryComponent` |
| `/games/:id`            | Game Detail       | None                                                                                        | Public            | `GameDetailComponent`     |
| `/creators/:id`         | Creator Portfolio | None                                                                                        | Public            | `CreatorProfileComponent` |
| `/login`                | Login             | None                                                                                        | Public            | `LoginComponent`          |
| `/register`             | Register          | None                                                                                        | Public            | `RegisterComponent`       |
| `/forgot-password`      | Forgot Password   | None                                                                                        | Public            | `ForgotPasswordComponent` |
| `/library`              | My Library        | `authGuard`                                                                                 | Any authenticated | `LibraryComponent`        |
| `/wishlist`             | Saved Games       | `authGuard`                                                                                 | Any authenticated | `WishlistComponent`       |
| `/orders`               | Order History     | `authGuard`                                                                                 | Any authenticated | `OrdersComponent`         |
| `/profile`              | User Profile      | `authGuard`                                                                                 | Any authenticated | `ProfileComponent`        |
| `/account/payment`      | Payment & Wallet  | `authGuard`                                                                                 | Any authenticated | `AccountPaymentComponent` |
| `/studio`               | Creator Studio    | `authGuard` + `roleGuard('creator')`                                                         | Creator           | `CreatorStudioComponent`  |
| `/studio/games/new`     | New Listing       | `authGuard` + `roleGuard('creator')` + `canDeactivate(unsavedChangesGuard)`                  | Creator           | `GameFormComponent`       |
| `/studio/games/:id/edit`| Edit Listing      | `authGuard` + `roleGuard('creator')` + `ownershipGuard` + `canDeactivate(unsavedChangesGuard)`| Creator (own)     | `GameFormComponent`       |
| `/support`              | Support & Privacy | None                                                                                        | Public            | `SupportComponent`        |
| `/not-found`            | 404 Not Found     | None                                                                                        | Public            | `NotFoundComponent`       |
| `**`                    | Wildcard Catch    | None                                                                                        | Public            | Redirects to `/not-found` |

---

## Page Inventory

### 1. Game Catalog (`/catalog`) — Public

The landing page. Browsable by anyone.

| Element              | Description                                                               |
|----------------------|---------------------------------------------------------------------------|
| **Search bar**       | Substring search against `game.title`, case-insensitive                   |
| **Tag filter chips** | Horizontal, single-select. Dynamic vocabulary from all games' `tags` arrays|
| **Game grid**        | CSS Grid of `game-card` components. 1 col < 768px, multi-col ≥ 768px       |
| **Empty state**      | Shown when search/filter yields zero results                              |
| **Loading spinner**  | Shown during simulated async fetch                                        |

**Data dependencies:** `GamesDataService.getGames(filters?)`

---

### 2. Game Detail (`/games/:id`) — Public

Single game's full information. The download button is the primary CTA.

| Element                     | Description                                                                             |
|-----------------------------|-----------------------------------------------------------------------------------------|
| **Hero cover image**        | Full-width `coverImageUrl`                                                              |
| **2-column layout**         | Info (title, creator name, description, tags) left; actions (download button, price) right|
| **Screenshot row**          | Horizontal scroll of `screenshotUrls`                                                   |
| **Download button**         | 5-state component (see below)                                                           |
| **Purchase confirm modal**  | Triggered when a logged-in user clicks "Buy" on a paid game                             |

**Data dependencies:** `GamesDataService.getGameById(id)`, `UsersDataService` (resolve `ownerId` → display name), `LibraryDataService.isOwned(userId, gameId)`

---

### 3. Login (`/login`) — Public

| Element                  | Description                                                        |
|--------------------------|--------------------------------------------------------------------|
| **Email / password form**| Validates against seeded users                                     |
| **Forgot password link** | Routes to `/forgot-password`                                       |
| **Demo account pills**   | Quick-login buttons for pre-seeded users                           |
| **Social login buttons** | Google & Apple SVG icon buttons (simulated 1-click)                |
| **Register link**        | Routes to `/register`                                              |
| **returnUrl support**    | After login, redirects to the page the user was trying to reach    |

**Data dependencies:** `AuthService.login()`

---

### 4. Register (`/register`) — Public

| Element                                 | Description                                        |
|-----------------------------------------|----------------------------------------------------|
| **Email / password / display name form**| Creates a new user in the mock store               |
| **"I want to publish games" toggle**    | Sets role to `creator` if checked                  |
| **Login link**                          | Routes to `/login`                                 |

**Data dependencies:** `AuthService.register()`

---

### 5. Forgot Password (`/forgot-password`) — Public

| Element                   | Description                                        |
|---------------------------|----------------------------------------------------|
| **Email form**            | Accepts email to send simulated reset link         |
| **Send Reset Link CTA**   | Triggers simulated password reset                  |
| **Confirmation feedback** | Success alert confirming link sent                 |
| **Back to login link**    | Routes back to `/login`                            |

**Data dependencies:** `AuthService.requestPasswordReset()`

---

### 6. My Library (`/library`) — Auth Required

| Element             | Description                                                                        |
|---------------------|------------------------------------------------------------------------------------|
| **Owned games list**| Each entry shows game title, cover thumbnail, acquired date, and a download button |
| **Download button** | "Download" for available games, "Unavailable" for soft-deleted games               |
| **Empty state**     | "You haven't acquired any games yet" with link to catalog                          |

**Data dependencies:** `LibraryDataService.getLibrary(userId)`, `GamesDataService.getGameById(id)` (for each entry)

---

### 7. Order History (`/orders`) — Auth Required

| Element                 | Description                                                        |
|-------------------------|--------------------------------------------------------------------|
| **Orders list / table** | Order ID, Game Title, Price snapshot ($), Purchase Date, Status    |
| **View game link**      | Navigates to `/games/:id`                                          |
| **Empty state**         | "No purchases yet" with CTA to browse games                        |

**Data dependencies:** `OrdersDataService.getOrders(userId)`, `GamesDataService.getGameById(id)`

---

### 8. User Profile (`/profile`) — Auth Required

| Element              | Description                                                    |
|----------------------|----------------------------------------------------------------|
| **Account info card**| User display name, email, member since, role badges            |
| **Role toggle**      | Enable Creator privileges toggle                               |
| **Demo data reset**  | Button to reset mock database to initial seed data             |
| **Logout button**    | Terminates session and redirects to `/catalog`                 |

**Data dependencies:** `AuthService.currentUser()`, `LocalStoreService.resetToSeedData()`

---

### 9. Creator Studio (`/studio`) — Creator Role Required

> [!NOTE]
> This is a **stretch goal** (Task 9, Phase 4). The architecture is fully designed but may not be implemented in the initial build.

| Element                     | Description                                                        |
|-----------------------------|--------------------------------------------------------------------|
| **Listing table**           | Title, price, date, Edit/Delete actions                            |
| **Create button**           | Routes to `/studio/games/new`                                      |
| **Soft-delete confirmation**| Modal before setting `deletedAt`                                   |

**Data dependencies:** `GamesDataService.getGames()` filtered by `ownerId === currentUserId`

---

### 10. Game Form (`/studio/games/new`, `/studio/games/:id/edit`) — Creator + Ownership

| Element             | Description                                                                    |
|---------------------|--------------------------------------------------------------------------------|
| **Reactive form**   | Title, description, price, cover URL, screenshot URLs, sample package URL      |
| **Tag chip input**  | Interactive add/remove with validation (1–5 tags, 2–20 chars each)              |
| **Validation**      | Full validation rules per [reference-data-models.md](./reference-data-models.md)|

**Data dependencies:** `GamesDataService.createGame()` or `GamesDataService.updateGame()`

---

### 11. 404 Not Found (`/not-found`, `**`) — Public

| Element                       | Description                                       |
|-------------------------------|---------------------------------------------------|
| **Error illustration / Icon** | Prominent 404 error header                        |
| **Help text**                 | Explains the requested game or page was not found |
| **Back to catalog CTA**       | Button routing back to `/catalog`                 |

**Data dependencies:** None

---

### 12. Support & Help Center (`/support`) — Public

| Element                       | Description                                                                               |
|-------------------------------|-------------------------------------------------------------------------------------------|
| **FAQ Accordion**             | Expandable answers to common questions (DRM, downloads, creator publishing, demo accounts)|
| **Contact / Ticket Form**     | Reactive inputs for name, email, subject, message with validation                         |
| **Simulated Submit Banner**   | Confirmation alert displaying submitted ticket ID and response SLA                        |
| **Privacy & Trust Notice**    | Dedicated card (`#privacy`) detailing local storage data, mock payments, and DRM policies |

**Data dependencies:** `AuthService.currentUser()` (pre-populates name/email if logged in)

---

### 13. Genre & Category Directory (`/genres`) — Public

| Element                       | Description                                                                               |
|-------------------------------|-------------------------------------------------------------------------------------------|
| **Category Cards Grid**       | Visual cards for major genres (RPG, Action, Sci-Fi, Indie) with dynamic game counts       |
| **Browse Link**               | Clicking any card navigates to `/catalog?tag={tag}`                                       |
| **Loading Spinner**           | Shown during initial aggregation fetch                                                    |

**Data dependencies:** `GamesDataService.getGames()`

---

### 14. Wishlist & Bookmarks (`/wishlist`) — Auth Required

| Element                       | Description                                                                               |
|-------------------------------|-------------------------------------------------------------------------------------------|
| **Saved Games Grid**          | CSS Grid of `game-card` components displaying user's bookmarked games                     |
| **Heart / Remove Action**      | Toggle bookmark off to remove game from wishlist                                          |
| **Empty State**               | "Your wishlist is empty" with CTA routing to `/catalog`                                   |

**Data dependencies:** `GamesDataService.getGames()`, `LocalStoreService` / `wishlistGameIds` signal

---

### 15. Creator Portfolio (`/creators/:id`) — Public

| Element                       | Description                                                                               |
|-------------------------------|-------------------------------------------------------------------------------------------|
| **Developer Hero Card**       | Creator avatar, display name, biography, joined date, and `[ Creator ]` badge             |
| **Published Games Grid**      | CSS Grid of `game-card` components filtered by `game.ownerId === creatorId`               |
| **Empty State**               | Shown if creator has no active public listings                                            |

**Data dependencies:** `UsersDataService.getUser(id)`, `GamesDataService.getGames()`

---

### 16. Payment & Wallet (`/account/payment`) — Auth Required

| Element                       | Description                                                                               |
|-------------------------------|-------------------------------------------------------------------------------------------|
| **Wallet Balance Hero**       | Displays current available balance in USD with quick `Top Up` CTA                         |
| **Saved Cards Section**       | Grid of credit cards (Visa / Mastercard) with default pill, expiry, and delete actions     |
| **Cambodian KHQR Section**    | Cards for Bakong, ABA, ACLEDA, and Wing mobile banking accounts with dynamic QR modals    |
| **Add Payment Method Form**   | Caret-safe card input form with `appCardNumber`, `appExpiryDate`, `appCvv` formatters     |
| **Gift Card Redemption**      | Input field to redeem prepaid vouchers (`NEXORA-GIFT-50`, etc.) into direct wallet funds  |
| **Transaction History Ledger**| Chronological table of all top-ups, purchases, and gift card redemptions                  |

**Data dependencies:** `PaymentsDataService.getMethods()`, `PaymentsDataService.getWalletSnapshot()`, `AuthService.currentUser()`

---

## Download Button — 5 States & Fulfillment Flow

The most complex component in the app. Its state depends on auth status, ownership, price, and game availability:

```mermaid
flowchart TD
    START(["👤 User Clicks Download Button on /games/:id"]) --> CHECK_AUTH{"Is User<br/>Logged In?"}

    %% ANONYMOUS BRANCH
    CHECK_AUTH -->|No: Anonymous| REDIRECT["🔄 Redirect to /login<br/>(Preserve returnUrl)"]
    REDIRECT --> LOGIN_SUCCESS["🔑 User Authenticates<br/>(Bounces back to Game Detail)"]
    LOGIN_SUCCESS --> CHECK_OWNED

    %% AUTHENTICATED BRANCH
    CHECK_AUTH -->|Yes: Logged In| CHECK_OWNED{"Does User<br/>Own the Game?"}

    %% ALREADY OWNED
    CHECK_OWNED -->|Yes: Already in Library| DL_DIRECT["⚡ Instant File Download<br/>(Browser downloads .zip)"]

    %% NOT OWNED BRANCH
    CHECK_OWNED -->|No: Not Owned| CHECK_PRICE{"Is the Game<br/>Free or Paid?"}

    %% FREE ACQUISITION
    CHECK_PRICE -->|Free: $0.00| ADD_LIB_FREE["📦 Add to Library<br/>(LibraryService.addToLibrary)"]
    ADD_LIB_FREE --> UPDATE_SIGNAL_FREE["✨ isOwned Signal = true<br/>(Button updates to 'Download')"]
    UPDATE_SIGNAL_FREE --> DL_DIRECT

    %% PAID PURCHASE FLOW
    CHECK_PRICE -->|Paid: > $0.00| MODAL["💳 Open Purchase Modal<br/>(Review Title & Price)"]
    MODAL --> USER_CONFIRM{"User Confirms<br/>Purchase?"}
    USER_CONFIRM -->|Cancel| CLOSE_MODAL["❌ Modal Closed<br/>(No changes made)"]
    USER_CONFIRM -->|Confirm| CREATE_ORDER["🧾 Create Order Receipt<br/>(OrdersService.createOrder)"]
    CREATE_ORDER --> ADD_LIB_PAID["📦 Add to Library<br/>(LibraryService.addToLibrary)"]
    ADD_LIB_PAID --> UPDATE_SIGNAL_PAID["✨ isOwned Signal = true<br/>(Modal closes & Button flips to 'Download')"]
    UPDATE_SIGNAL_PAID --> AUTO_DL["🚀 Automatic File Download<br/>(Browser downloads .zip immediately)"]

    %% VISUAL STYLING
    classDef action fill:#EFF6FF,stroke:#2563EB,stroke-width:2px,color:#1E40AF;
    classDef decision fill:#FEF3C7,stroke:#D97706,stroke-width:2px,color:#92400E;
    classDef success fill:#ECFDF5,stroke:#059669,stroke-width:2px,color:#065F46;
    classDef cancel fill:#FEE2E2,stroke:#DC2626,stroke-width:2px,color:#991B1B;

    class START,REDIRECT,LOGIN_SUCCESS,MODAL,CREATE_ORDER,ADD_LIB_FREE,ADD_LIB_PAID action;
    class CHECK_AUTH,CHECK_OWNED,CHECK_PRICE,USER_CONFIRM decision;
    class DL_DIRECT,AUTO_DL,UPDATE_SIGNAL_FREE,UPDATE_SIGNAL_PAID success;
    class CLOSE_MODAL cancel;
```

---

### Button State Machine

```mermaid
stateDiagram-v2
    [*] --> Anonymous
    [*] --> FreeUnowned
    [*] --> PaidUnowned
    [*] --> Owned
    [*] --> Unavailable

    state "Anonymous" as Anonymous
    state "Free + Unowned" as FreeUnowned
    state "Paid + Unowned" as PaidUnowned
    state "Owned" as Owned
    state "Unavailable" as Unavailable

    Anonymous --> FreeUnowned: Login completes, unowned, price = 0
    Anonymous --> PaidUnowned: Login completes, unowned, price > 0
    Anonymous --> Owned: Login completes, already owns the game
    FreeUnowned --> Owned: addToLibrary
    PaidUnowned --> Owned: Confirm purchase
    Owned --> Owned: Re-download
```

> **5 button states only.** `Anonymous` shows "Download" (redirects to login). `Free + Unowned` shows "Download Free". `Paid + Unowned` shows "Buy $X.XX" (opens confirm modal). `Owned` shows "Download". `Unavailable` is a terminal state (disabled).
>
> **Corrected 2026-08-17:** this diagram previously omitted the `Anonymous --> Owned` transition — a user who is bounced through login but already owns the game (e.g. re-downloading in a new browser session) goes straight to the "Owned" state, as the flowchart above it already showed via `CHECK_AUTH → REDIRECT → LOGIN_SUCCESS → CHECK_OWNED → DL_DIRECT`. This file's diagram is now consistent with its own flowchart and with `explanation-download-flow.md`.

| State              | Button Label     | Action                                                                                                             |
|--------------------|------------------|--------------------------------------------------------------------------------------------------------------------|
| **Anonymous**      | "Download"       | Redirect to `/login?returnUrl=...`                                                                                 |
| **Free + Unowned** | "Download Free"  | `addToLibrary()` → trigger direct file download                                                                    |
| **Paid + Unowned** | "Buy $X.XX"      | Open `purchase-confirm-modal` → on confirm: `createOrder()` + `addToLibrary()` → trigger file download → "Download" |
| **Owned**          | "Download"       | Trigger file download directly                                                                                     |
| **Unavailable**    | "Unavailable"    | Disabled, no action                                                                                                |

---

## Layout Shell

Every page is wrapped in a consistent layout shell:

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                         │
│  [Logo/Title]  [Catalog] [Library?] [Orders?] [Studio?] [Profile]│
│                [Login/Logout] [DisplayName]                     │
│  ← hamburger menu at mobile                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  <router-outlet />                                              │
│  (page content)                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Footer — © copyright                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Header Nav — Conditional Links

> Corrected 2026-08-17: this table previously omitted Genres from every state and Wishlist from Buyer/Creator, which disagreed with `design_doc.md`'s Task 4. `design_doc.md` is authoritative per its Document Precedence section — this table is now brought into line with it.

| Auth State    | Visible Nav Links                                                                                    |
|---------------|--------------------------------------------------------------------------------------------------------|
| **Anonymous** | Catalog · Genres · Login                                                                               |
| **Buyer**     | Catalog · Genres · Library · Wishlist · Orders · Profile · _[Display Name]_ · Logout                   |
| **Creator**   | Catalog · Genres · Library · Wishlist · Orders · Creator Studio · Profile · _[Display Name]_ · Logout   |

---

## Guard Chain

```mermaid
flowchart LR
    REQ["Route Request"] --> AUTH{"authGuard"}
    AUTH -->|"No session"| LOGIN["Redirect to /login<br/>+ save returnUrl"]
    AUTH -->|"Has session"| ROLE{"roleGuard"}
    ROLE -->|"Missing role"| CAT_R["Redirect to /catalog"]
    ROLE -->|"Has role"| OWN{"ownershipGuard"}
    OWN -->|"Not owner"| CAT_R2["Redirect to /catalog"]
    OWN -->|"Is owner"| PASS["Route activated ✅"]

    classDef fail fill:#FEE2E2,stroke:#EF4444,color:#991B1B
    classDef pass fill:#D1FAE5,stroke:#10B981,color:#065F46
    classDef guard fill:#FEF3C7,stroke:#F59E0B,color:#92400E

    class LOGIN,CAT_R,CAT_R2 fail
    class PASS pass
    class AUTH,ROLE,OWN guard
```

| Guard                  | Checks                             | Failure Redirect                     |
|------------------------|------------------------------------|--------------------------------------|
| `authGuard`            | `AuthService.currentUser()` exists | `/login?returnUrl=<attempted-route>` |
| `roleGuard('creator')` | `user.roles.includes('creator')`   | `/catalog`                           |
| `ownershipGuard`       | `game.ownerId === currentUser.id`  | `/catalog`                           |

---

## Data Flow — Layer Diagram

```mermaid
flowchart TB
    subgraph Features["Feature Components"]
        CAT["GameCatalog"]
        DET["GameDetail"]
        LIB["Library"]
        ORD["Orders"]
        PROF["Profile"]
        STU["CreatorStudio"]
    end

    subgraph DI["DI Injection Tokens"]
        GT["GAMES_DATA"]
        LT["LIBRARY_DATA"]
        OT["ORDERS_DATA"]
        UT["USERS_DATA"]
    end

    subgraph Mock["Mock Services"]
        GM["GamesMock"]
        LM["LibraryMock"]
        OM["OrdersMock"]
        UM["UsersMock"]
    end

    subgraph HTTP["HTTP Services (future)"]
        GH["GamesHttp"]
        LH["LibraryHttp"]
        OH["OrdersHttp"]
        UH["UsersHttp"]
    end

    subgraph Persistence["Persistence"]
        LS["LocalStoreService<br/>IndexedDB / localStorage"]
    end

    CAT -->|inject| GT
    DET -->|inject| GT
    LIB -->|inject| LT
    ORD -->|inject| OT
    ORD -->|inject| GT
    DET -->|inject| OT
    DET -->|inject| UT
    PROF -->|reset| LS
    STU -->|inject| UT

    GT -.->|now| GM
    GT -.->|future| GH
    LT -.->|now| LM
    OT -.->|now| OM
    UT -.->|now| UM

    GM --> LS
    LM --> LS
    OM --> LS
    UM --> LS
```

---

## Component Tree

```
AppComponent
├── HeaderComponent
│   ├── Logo / Title
│   ├── NavLinks (conditional on auth state)
│   ├── UserDisplay + Logout (if authenticated)
│   └── HamburgerMenu (mobile)
│
├── <router-outlet>
│   ├── GameCatalogComponent
│   │   ├── SearchInput
│   │   ├── TagFilterChips
│   │   ├── GameCardComponent[] (grid)
│   │   ├── LoadingSpinnerComponent
│   │   └── EmptyStateComponent
│   │
│   ├── GameDetailComponent
│   │   ├── Hero Cover Image
│   │   ├── Game Info (title, creator, description, tags)
│   │   ├── ScreenshotRow
│   │   ├── DownloadButtonComponent
│   │   └── PurchaseConfirmModalComponent
│   │
│   ├── LoginComponent
│   │   ├── EmailPasswordForm
│   │   ├── DemoAccountPills
│   │   └── SocialLoginButtons (Google, Apple SVGs)
│   │
│   ├── RegisterComponent
│   │   ├── RegistrationForm
│   │   └── CreatorToggle
│   │
│   ├── ForgotPasswordComponent
│   │   ├── ResetEmailForm
│   │   └── SuccessConfirmationBanner
│   │
│   ├── LibraryComponent
│   │   ├── OwnedGameEntry[] (list)
│   │   │   ├── GameThumbnail
│   │   │   └── DownloadButtonComponent
│   │   └── EmptyStateComponent
│   │
│   ├── OrdersComponent
│   │   ├── OrderReceiptRow[] (table)
│   │   └── EmptyStateComponent
│   │
│   ├── ProfileComponent
│   │   ├── AccountInfoCard (RoleBadges)
│   │   ├── CreatorPrivilegeToggle
│   │   └── ResetDemoDataButton
│   │
│   ├── CreatorStudioComponent (stretch)
│   │   ├── ListingTable
│   │   └── GameFormComponent (create/edit)
│   │       └── TagChipInput
│   │
│   ├── SupportComponent
│   │   ├── FaqAccordion
│   │   └── ContactTicketForm
│   │
│   └── NotFoundComponent (404)
│       ├── ErrorIcon / Typography
│       └── ReturnToCatalogCTA
│
└── FooterComponent
    ├── Copyright
    └── FooterNavLinks (Catalog, Support, Privacy)
```

---

## Shared UI Components

| Component                       | Purpose                              | Used By                 |
|---------------------------------|--------------------------------------|-------------------------|
| `GameCardComponent`             | Cover image, title, price badge      | Catalog                 |
| `DownloadButtonComponent`       | 5-state download CTA                 | Game Detail, Library    |
| `PurchaseConfirmModalComponent` | Game title + price + Confirm/Cancel  | Game Detail             |
| `LoadingSpinnerComponent`       | Consistent loading indicator         | Catalog, Detail, Library, Orders |
| `EmptyStateComponent`           | Icon + message + CTA                 | Catalog, Library, Orders, Studio |
| `RoleBadgeComponent`            | Buyer/Creator badge                  | Header, Profile         |
| `TagChipInputComponent`         | Add/remove tag chips with validation | Game Form (stretch)     |

---

## User Flows & Sequence Diagrams

---

### Flow 1: Gated Download (Primary Demo Flow)

The primary user journey demonstrating auth gating, role-based behavior, catalog exploration, library persistence, and sample package downloading.

#### Visual Flowchart

```mermaid
flowchart TD
    START(["User clicks 'Download' on Game Detail"]) --> CHECK_AUTH{"Logged in?"}

    %% Anonymous Gate
    CHECK_AUTH -- "No (Anonymous)" --> REDIRECT["Redirect to /login<br/>(store returnUrl=/games/:id)"]
    REDIRECT --> LOGIN_PAGE["User logs in / clicks demo pill"]
    LOGIN_PAGE --> RETURN["Redirect back to /games/:id"]
    RETURN --> CHECK_OWNED

    %% Authenticated Flow
    CHECK_AUTH -- "Yes" --> CHECK_OWNED{"Already in Library?"}

    %% Owned Flow
    CHECK_OWNED -- "Yes (Owned)" --> TRIGGER_DL["Trigger Browser File Download"]

    %% Unowned Branch
    CHECK_OWNED -- "No (Unowned)" --> CHECK_PRICE{"Game Price"}

    %% Free Flow
    CHECK_PRICE -- "Price = $0 (Free)" --> ADD_LIB_FREE["LibraryData.addToLibrary()"]
    ADD_LIB_FREE --> TRIGGER_DL

    %% Paid Flow
    CHECK_PRICE -- "Price > $0 (Paid)" --> SHOW_MODAL["Show Purchase Confirmation Modal"]
    SHOW_MODAL --> USER_CONFIRM{"User Confirms?"}
    USER_CONFIRM -- "Cancel" --> DISMISS["Dismiss Modal (No changes)"]
    USER_CONFIRM -- "Confirm" --> CREATE_ORDER["OrdersData.createOrder()"]
    CREATE_ORDER --> ADD_LIB_PAID["LibraryData.addToLibrary()"]
    ADD_LIB_PAID --> TRIGGER_DL

    TRIGGER_DL --> SUCCESS(["✅ Game Added to Library & Download Started"])

    classDef decision fill:#FEF3C7,stroke:#F59E0B,color:#92400E
    classDef auth fill:#DDD8FC,stroke:#5747D6,color:#1C1A17
    classDef action fill:#F1EFFE,stroke:#6D5EF0,color:#1C1A17
    classDef success fill:#D1FAE5,stroke:#10B981,color:#065F46
    classDef finish fill:#E0E7FF,stroke:#4F46E5,color:#1E1B4B

    class CHECK_AUTH,CHECK_OWNED,CHECK_PRICE,USER_CONFIRM decision
    class REDIRECT,LOGIN_PAGE,RETURN auth
    class ADD_LIB_FREE,SHOW_MODAL,CREATE_ORDER,ADD_LIB_PAID,DISMISS action
    class TRIGGER_DL,SUCCESS finish
```

#### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Buyer
    participant UI as GameDetail & Modal
    participant Auth as AuthService
    participant Lib as LibraryDataService
    participant Orders as OrdersDataService
    participant Browser as Browser Download

    User->>UI: 1. Click "Download" / "Buy"
    UI->>Auth: 2. Check currentUser()

    alt Anonymous (Not Authenticated)
        Auth-->>UI: null (No session)
        UI->>User: 3. Redirect to /login?returnUrl=/games/:id
        User->>Auth: 4. Submit credentials / demo pill
        Auth-->>UI: 5. Session created & redirect back to /games/:id
    end

    alt Already Owned
        UI->>Browser: 6. Trigger download directly
    else Free Game (Price = $0)
        User->>UI: 7. Click "Download Free"
        UI->>Lib: 8. addToLibrary(userId, gameId)
        Lib-->>UI: 9. LibraryEntry created
        UI->>Browser: 10. Trigger sample package download
    else Paid Game (Price > $0)
        User->>UI: 11. Click "Buy $X.XX"
        UI->>User: 12. Display PurchaseConfirmModal
        User->>UI: 13. Click "Confirm Purchase"
        UI->>Orders: 14. createOrder(userId, gameId)
        Orders-->>UI: 15. Order record created
        UI->>Lib: 16. addToLibrary(userId, gameId, orderId)
        Lib-->>UI: 17. LibraryEntry linked to order
        UI->>Browser: 18. Trigger sample package download
        UI->>User: 19. Update button to "Download" (Owned)
    end
```

#### Step-by-Step Breakdown

| Step   | Phase             | Trigger / Action                               | System Behavior & State Transition                                                        |
|:------:|-------------------|------------------------------------------------|-------------------------------------------------------------------------------------------|
| **1**  | **Discovery**     | User browses `/catalog` and clicks a game card | Route navigates to `/games/:id`. Resolves game details, creator name, and ownership state.|
| **2**  | **Auth Check**    | User clicks CTA button                         | Reads `AuthService.currentUser()`. If `null`, redirects to `/login` with `returnUrl`.     |
| **3**  | **Auth Return**   | User completes login                           | Sets active user signal; router returns user directly to the original `/games/:id` page. |
| **4A** | **Free Download** | User clicks `"Download Free"`                  | Calls `LIBRARY_DATA.addToLibrary()`. Creates `LibraryEntry`, state $\rightarrow$ `Owned`. |
| **4B** | **Paid Purchase** | User clicks `"Buy $X.XX"`                      | Opens modal. On confirm: calls `ORDERS_DATA.createOrder()` then `addToLibrary()`.         |
| **5**  | **File Delivery** | Entry recorded                                 | Emits file download of `samplePackageUrl`, updates button state to `"Download"`.          |

---

### Flow 2: Authentication, Demo Quick-Login & Return Navigation

Handles credential verification, 1-click demo account switching, social sign-in simulation, and deep-link returnUrl preservation.

#### Visual Flowchart

```mermaid
flowchart TD
    ENTRY(["User lands on /login"]) --> CHOICE{"Login Method"}

    CHOICE -- "Demo Pill" --> CLICK_PILL["Click (alice / bob / carol)"]
    CHOICE -- "Credentials" --> FORM_INPUT["Enter email + password"]
    CHOICE -- "Social Sign-in" --> SOCIAL_CLICK["Click Google / Apple SVG"]

    CLICK_PILL --> AUTH_CALL["AuthService.login()"]
    FORM_INPUT --> AUTH_CALL
    SOCIAL_CLICK --> SOCIAL_CALL["AuthService.socialLogin()"]
    SOCIAL_CALL --> AUTH_CALL

    AUTH_CALL --> VALIDATE{"Valid?"}
    VALIDATE -- "No" --> ERR_MSG["Show Error Alert"]
    VALIDATE -- "Yes" --> SET_SESSION["Update currentUser Signal & Storage"]

    SET_SESSION --> CHECK_RETURN{"returnUrl in QueryParams?"}
    CHECK_RETURN -- "Yes" --> NAV_RETURN["Router.navigateByUrl(returnUrl)"]
    CHECK_RETURN -- "No" --> NAV_CATALOG["Router.navigate(['/catalog'])"]

    NAV_RETURN --> COMPLETE(["✅ User Authenticated on Target Page"])
    NAV_CATALOG --> COMPLETE

    classDef decision fill:#FEF3C7,stroke:#F59E0B,color:#92400E
    classDef auth fill:#DDD8FC,stroke:#5747D6,color:#1C1A17
    classDef error fill:#FEE2E2,stroke:#EF4444,color:#991B1B
    classDef success fill:#D1FAE5,stroke:#10B981,color:#065F46

    class CHOICE,VALIDATE,CHECK_RETURN decision
    class CLICK_PILL,FORM_INPUT,SOCIAL_CLICK,AUTH_CALL,SOCIAL_CALL,SET_SESSION,NAV_RETURN,NAV_CATALOG auth
    class ERR_MSG error
    class COMPLETE success
```

#### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant LoginUI as LoginComponent
    participant Auth as AuthService
    participant Store as LocalStoreService
    participant Router as Angular Router

    User->>LoginUI: 1. Click Demo Account Pill (e.g. Alice - Creator)
    LoginUI->>Auth: 2. login('alice@nexora.io', 'password123')
    Auth->>Store: 3. Look up seeded user by email (password not checked)
    Store-->>Auth: 4. User record found (id: 'u1', roles: ['creator', 'buyer'])
    Auth->>Store: 5. Persist session token to localStorage / IndexedDB
    Auth->>Auth: 6. currentUser.set(user)
    Auth-->>LoginUI: 7. Login successful

    alt QueryParams contains returnUrl
        LoginUI->>Router: 8. navigateByUrl(returnUrl)
    else No returnUrl
        LoginUI->>Router: 9. navigate(['/catalog'])
    end
    Router-->>User: 10. Render destination page with authenticated state
```

#### Step-by-Step Breakdown

| Step  | Action           | Description                                                                                                                              |
|:-----:|------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| **1** | **User Trigger** | User either enters credentials, clicks Google/Apple SVG, or clicks a pre-seeded Demo Account pill.                                       |
| **2** | **Lookup**       | `AuthService` matches the submitted email against seeded accounts (password is ignored — mock only) and creates session state.           |
| **3** | **State Update** | `currentUser` signal is updated, header reactive signals re-render (display name, avatar, conditional Creator Studio links).             |
| **4** | **Redirection**  | If user arrived via a guard redirect (e.g., trying to download a game), `returnUrl` is loaded to resume context immediately.             |

---

### Flow 3: Route Guard Chain Execution

Demonstrates the 3-tier defense-in-depth protection for protected routes (`/library`, `/orders`, `/profile`, `/studio`, `/studio/games/:id/edit`).

#### Visual Flowchart

```mermaid
flowchart TD
    START(["Navigation Trigger: User requests Route"]) --> CHECK_AUTH_REQ{"Route requires<br/>authGuard?"}

    %% Public Branch
    CHECK_AUTH_REQ -->|"No (Public Route)"| ACTIVATE_PUB(["✅ Route Activated<br/>(/catalog, /games/:id, /login, /register, /support)"])

    %% Auth Check
    CHECK_AUTH_REQ -->|"Yes (/library, /studio...)"| EXEC_AUTH{"authGuard<br/>AuthService.currentUser()?"}

    EXEC_AUTH -->|"No Session (null)"| RED_LOGIN["Redirect to /login<br/>(Store returnUrl in queryParams)"]
    RED_LOGIN --> FAIL_AUTH(["❌ Navigation Halted -> Show Login Form"])

    EXEC_AUTH -->|"Has Active Session"| CHECK_ROLE_REQ{"Route requires<br/>roleGuard('creator')?"}

    %% Buyer Route Activation
    CHECK_ROLE_REQ -->|"No (Buyer Route)"| ACTIVATE_LIB(["✅ Route Activated<br/>(/library, /orders, /profile)"])

    %% Role Check
    CHECK_ROLE_REQ -->|"Yes (/studio...)"| EXEC_ROLE{"roleGuard<br/>user.roles.includes('creator')?"}

    EXEC_ROLE -->|"Missing Role"| RED_CAT_ROLE["Redirect to /catalog<br/>(Unauthorized)"]
    RED_CAT_ROLE --> FAIL_ROLE(["❌ Navigation Halted -> Show Catalog"])

    EXEC_ROLE -->|"Has Creator Role"| CHECK_OWN_REQ{"Route requires<br/>ownershipGuard?"}

    %% Creator Studio Activation
    CHECK_OWN_REQ -->|"No (New / Studio List)"| ACTIVATE_STUDIO(["✅ Route Activated<br/>(/studio, /studio/games/new)"])

    %% Ownership Check
    CHECK_OWN_REQ -->|"Yes (/studio/games/:id/edit)"| EXEC_OWN{"ownershipGuard<br/>game.ownerId === currentUser.id?"}

    EXEC_OWN -->|"Not Owner"| RED_CAT_OWN["Redirect to /catalog<br/>(Forbidden)"]
    RED_CAT_OWN --> FAIL_OWN(["❌ Navigation Halted -> Show Catalog"])

    EXEC_OWN -->|"Is Owner"| ACTIVATE_EDIT(["✅ Route Activated<br/>(/studio/games/:id/edit)"])

    classDef startNode fill:#E0E7FF,stroke:#4F46E5,color:#1E1B4B
    classDef decision fill:#FEF3C7,stroke:#F59E0B,color:#92400E
    classDef redirect fill:#FEE2E2,stroke:#EF4444,color:#991B1B
    classDef failNode fill:#FEE2E2,stroke:#B91C1C,color:#7F1D1D
    classDef successNode fill:#D1FAE5,stroke:#10B981,color:#065F46

    class START startNode
    class CHECK_AUTH_REQ,EXEC_AUTH,CHECK_ROLE_REQ,EXEC_ROLE,CHECK_OWN_REQ,EXEC_OWN decision
    class RED_LOGIN,RED_CAT_ROLE,RED_CAT_OWN redirect
    class FAIL_AUTH,FAIL_ROLE,FAIL_OWN failNode
    class ACTIVATE_PUB,ACTIVATE_LIB,ACTIVATE_STUDIO,ACTIVATE_EDIT successNode
```

#### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Router as Angular Router
    participant AG as authGuard
    participant RG as roleGuard('creator')
    participant OG as ownershipGuard
    participant Auth as AuthService
    participant Games as GamesDataService
    participant Target as Protected Component

    User->>Router: 1. Navigate to `/studio/games/g1/edit`
    Router->>AG: 2. Execute authGuard()
    AG->>Auth: 3. Check currentUser()

    alt No Session
        Auth-->>AG: null
        AG-->>Router: 4. RedirectUrl('/login?returnUrl=...')
    else Has Session
        Auth-->>AG: User logged in
        AG-->>Router: 5. Pass (true)

        Router->>RG: 6. Execute roleGuard('creator')
        RG->>Auth: 7. Check user.roles.includes('creator')
        alt Missing Creator Role
            RG-->>Router: 8. RedirectUrl('/catalog')
        else Has Creator Role
            RG-->>Router: 9. Pass (true)

            Router->>OG: 10. Execute ownershipGuard(route.params.id)
            OG->>Games: 11. getGameById('g1')
            Games-->>OG: game data (ownerId: 'u1')
            alt Current User != ownerId
                OG-->>Router: 12. RedirectUrl('/catalog')
            else Current User == ownerId
                OG-->>Router: 13. Pass (true)
                Router->>Target: 14. Activate GameFormComponent
                Target-->>User: 15. Render pre-filled edit form
            end
        end
    end
```

#### Step-by-Step Breakdown

| Step  | Guard Layer               | Evaluated Condition                    | Success Action                                  | Failure Action & Redirect                                          |
|:-----:|---------------------------|----------------------------------------|-------------------------------------------------|--------------------------------------------------------------------|
| **1** | **`authGuard`**           | `AuthService.currentUser() !== null`   | Allow pipeline to continue to next guard.       | Cancel navigation $\rightarrow$ Redirect to `/login?returnUrl=...`|
| **2** | **`roleGuard('creator')`**| `currentUser.roles.includes('creator')`| Allow pipeline to continue to next guard.       | Cancel navigation $\rightarrow$ Redirect to `/catalog`             |
| **3** | **`ownershipGuard`**      | `targetGame.ownerId === currentUser.id`| Activate requested route and render component.  | Cancel navigation $\rightarrow$ Redirect to `/catalog`             |

#### Guard Matrix Reference

| Route                   | Guard Sequence                                        | Check Criteria                    | On Fail Redirect             |
|-------------------------|-------------------------------------------------------|-----------------------------------|------------------------------|
| `/library`              | `[authGuard]`                                         | `currentUser() !== null`          | `/login?returnUrl=/library`  |
| `/wishlist`             | `[authGuard]`                                         | `currentUser() !== null`          | `/login?returnUrl=/wishlist` |
| `/orders`               | `[authGuard]`                                         | `currentUser() !== null`          | `/login?returnUrl=/orders`   |
| `/profile`              | `[authGuard]`                                         | `currentUser() !== null`          | `/login?returnUrl=/profile`  |
| `/studio`               | `[authGuard, roleGuard('creator')]`                   | `roles.includes('creator')`       | `/catalog`                   |
| `/studio/games/new`     | `[authGuard, roleGuard('creator')]`                   | `roles.includes('creator')`       | `/catalog`                   |
| `/studio/games/:id/edit`| `[authGuard, roleGuard('creator'), ownershipGuard]`   | `game.ownerId === currentUser.id` | `/catalog`                   |

---

### Flow 4: Creator Game Publishing & Editing Flow (Stretch)

Demonstrates how creators scaffold, validate, publish, and persist game listings into the mock IndexedDB store.

#### Visual Flowchart

```mermaid
flowchart TD
    START(["Creator enters /studio"]) --> ACTION{"Action Trigger"}

    ACTION -->|"Click '+ New Game'"| FORM_NEW["Render Blank GameForm<br/>(Mode: Create)"]
    ACTION -->|"Click 'Edit' on Game"| FETCH_GAME["GamesDataService.getGameById()"]
    FETCH_GAME --> FORM_EDIT["Render Pre-filled GameForm<br/>(Mode: Edit)"]

    FORM_NEW --> EDIT_FIELDS["Fill Fields:<br/>• Title (3-80 chars)<br/>• Description (10-2000)<br/>• Price (>= 0)<br/>• Tags (1-5 chips)<br/>• Cover & Zip URLs"]
    FORM_EDIT --> EDIT_FIELDS

    EDIT_FIELDS --> SUBMIT["Click 'Publish' / 'Save Changes'"]
    SUBMIT --> VALIDATE{"Form Valid?"}

    VALIDATE -->|"No (Invalid)"| SHOW_ERR["Display Field Errors<br/>(Highlight invalid inputs)"]
    SHOW_ERR --> EDIT_FIELDS

    VALIDATE -->|"Yes (Valid)"| MODE_CHECK{"Submission Mode"}

    MODE_CHECK -->|"Create New"| SVC_CREATE["GamesDataService.createGame(dto)"]
    MODE_CHECK -->|"Save Edits"| SVC_UPDATE["GamesDataService.updateGame(id, dto)"]

    SVC_CREATE --> DB_STORE[("IndexedDB / LocalStore<br/>Append Game Record")]
    SVC_UPDATE --> DB_STORE

    DB_STORE --> NAV_STUDIO["Router.navigate(['/studio'])"]
    NAV_STUDIO --> SUCCESS(["✅ Updated Listings Table in Studio"])

    classDef startNode fill:#E0E7FF,stroke:#4F46E5,color:#1E1B4B
    classDef decision fill:#FEF3C7,stroke:#F59E0B,color:#92400E
    classDef formNode fill:#DDD8FC,stroke:#5747D6,color:#1C1A17
    classDef serviceNode fill:#F1EFFE,stroke:#6D5EF0,color:#1C1A17
    classDef dbNode fill:#CFFAFE,stroke:#0891B2,color:#164E63
    classDef errorNode fill:#FEE2E2,stroke:#EF4444,color:#991B1B
    classDef finishNode fill:#D1FAE5,stroke:#10B981,color:#065F46

    class START startNode
    class ACTION,VALIDATE,MODE_CHECK decision
    class FORM_NEW,FETCH_GAME,FORM_EDIT,EDIT_FIELDS,SUBMIT,NAV_STUDIO formNode
    class SVC_CREATE,SVC_UPDATE serviceNode
    class DB_STORE dbNode
    class SHOW_ERR errorNode
    class SUCCESS finishNode
```

#### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Creator User
    participant FormUI as GameFormComponent
    participant Games as GamesDataService
    participant Store as LocalStoreService
    participant Router as Angular Router

    Creator->>FormUI: 1. Fill game details (Title, Price, Tags, Cover URL, Zip URL)
    Creator->>FormUI: 2. Submit form
    FormUI->>FormUI: 3. Validate form schema (title: 3-80 chars, price >= 0, tags: 1-5)

    alt Mode: Create New Game
        FormUI->>Games: 4. createGame(gameDto, ownerId)
        Games->>Store: 5. Append new Game record to games table
        Store-->>Games: 6. Stored successfully
        Games-->>FormUI: 7. Return created Game object
        FormUI->>Router: 8. navigate(['/studio']) with success notification
    else Mode: Edit Existing Game
        FormUI->>Games: 9. updateGame(gameId, updateDto)
        Games->>Store: 10. Update record in games table
        Store-->>Games: 11. Updated successfully
        Games-->>FormUI: 12. Return updated Game object
        FormUI->>Router: 13. navigate(['/studio'])
    end
    Router-->>Creator: 14. Render Creator Studio with updated listings table
```

#### Step-by-Step Breakdown

| Step   | Phase               | Action / Event                                                 | State & Storage Mutation                                                                  |
|:------:|---------------------|----------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| **1**  | **Form Initiation** | Creator navigates to `/studio/games/new` or `/studio/games/...`| If editing, fetches game via `GAMES_DATA.getGameById()` and pre-fills reactive controls.  |
| **2**  | **Tag Management**  | User inputs tags in `TagChipInputComponent`                    | Validates chip constraints (1–5 tags, 2–20 characters per tag, no duplicates).            |
| **3**  | **Validation**      | Creator clicks submit                                          | Synchronous validation runs across fields. Errors highlight affected inputs.              |
| **4A** | **Create Branch**   | Valid new listing submitted                                    | Invokes `createGame()`, generates new UUID, assigns `ownerId`, persists to IndexedDB.     |
| **4B** | **Edit Branch**     | Valid edits submitted                                          | Invokes `updateGame()`, updates existing record in IndexedDB `games` store.               |
| **5**  | **Confirmation**    | Storage transaction resolves                                   | Router navigates to `/studio`, displays success toast notification, table refreshes.      |

---

## Responsive Breakpoints

| Breakpoint             | Behavior                                                               |
|------------------------|------------------------------------------------------------------------|
| **< 768px** (mobile)   | Single-column catalog grid · Hamburger nav · Stacked game detail layout |
| **≥ 768px** (tablet+)  | Multi-column catalog grid · Horizontal nav · 2-column game detail       |

---

## Design Tokens Reference

```css
/* ==========================================================================
   NEXORA DESIGN TOKENS (CSS Custom Properties)
   ========================================================================== */
:root {
  /* Brand Primary — Electric Violet */
  --accent-400:    #A78BFA;
  --accent-500:    #8B5CF6;  /* glow highlights */
  --accent-600:    #7C3AED;  /* primary brand CTA / active links */
  --accent-700:    #6D28D9;  /* hover & active states */

  /* Cyber Accents */
  --cyan-400:      #22D3EE;  /* cyber cyan — info badges, genre chips */
  --cyan-500:      #06B6D4;
  --emerald-400:   #34D399;  /* neon emerald — owned badges, free tags */
  --emerald-500:   #10B981;
  --rose-500:      #F43F5E;  /* neon danger — soft delete modal, errors */

  /* Surfaces & Backgrounds */
  --bg-void:       #0B0D13;  /* root canvas background */
  --bg-surface:    #131622;  /* game cards, header, sidebar */
  --bg-elevated:   #1A1E2E;  /* modals, popovers, dropdowns */
  --bg-input:      #0E111B;  /* form inputs, search bar */

  /* Semantic Text Colors */
  --text-primary:   #F8FAFC;  /* main headlines & titles */
  --text-secondary: #94A3B8;  /* descriptions & metadata */
  --text-muted:     #64748B;  /* placeholders, timestamps */

  /* Borders & Glow Effects */
  --border-card:    #1E2438;
  --border-subtle:  rgba(139, 92, 246, 0.15);
  --border-glow:    rgba(139, 92, 246, 0.4);
  --shadow-glow:    0 0 20px rgba(124, 58, 237, 0.25);

  /* Spacing Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Border Radii */
  --radius-sm: 4px;
  --radius:    8px;   /* standard button / card radius */
  --radius-lg: 12px;  /* modal container radius */

  /* Typography */
  --font-sans: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

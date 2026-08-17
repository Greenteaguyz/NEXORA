# Test Suite Plan — NEXORA

> ⚠️ **Status as of 2026-08-17: aspirational / post-capstone reference material — NOT a build requirement.**
> This document describes a full four-framework test pyramid (Jest, Cucumber.js + Playwright, Playwright E2E, Stryker Mutator) with a CI-gated 90% coverage / 90% mutation-score bar. That's a reasonable target for a team with a production deploy target and months of runway — it is not achievable alongside auth, CRUD, the gated download flow, and 10+ documentation files in a **solo, 10-working-day capstone**. Per `design_doc.md`'s Document Precedence section (which is authoritative on scope), the *only* testing commitment for this capstone is `design_doc.md` Task 10.1: Jest unit tests for `DownloadButtonComponent`'s 5 states and the three route guards. If extra time remains after the graded competencies are demoable, pull individual test cases from Section 2 below (the Jest specs) — do not stand up the BDD, E2E, or mutation-testing layers under this deadline.
>
> **Status:** DRAFT — awaiting approval; kept as a reference for post-capstone / production hardening
> **Stack:** Angular 17+ · Jest · Cucumber.js + Playwright · Playwright · Stryker Mutator
> **Coverage Target:** 90% (statements, branches, functions, lines) — reference target only, not required for capstone submission

---

## Table of Contents

1. [Tooling & Setup](#1-tooling--setup)
2. [Unit Tests (Jest)](#2-unit-tests-jest)
3. [Gherkin / BDD Tests (Cucumber.js + Playwright)](#3-gherkin--bdd-tests-cucumberjs--playwright)
4. [QA / E2E Tests (Playwright)](#4-qa--e2e-tests-playwright)
5. [Quality Metrics](#5-quality-metrics)
6. [Mutation Testing (Stryker Mutator)](#6-mutation-testing-stryker-mutator)
7. [Test Coverage Enforcement](#7-test-coverage-enforcement)
8. [Directory Structure](#8-directory-structure)
9. [NPM Scripts](#9-npm-scripts)
10. [CI Integration Notes](#10-ci-integration-notes)

---

## 1. Tooling & Setup

| Purpose | Tool | Version | Notes |
|---------|------|---------|-------|
| Unit / Component testing | **Jest** + `jest-preset-angular` | Latest | Replaces Karma/Jasmine for faster DX |
| BDD / Gherkin | **Cucumber.js** + **Playwright** | Latest | `.feature` files → step definitions drive Playwright browser |
| E2E / QA | **Playwright** | Latest | Multi-browser (Chromium, Firefox, WebKit) |
| Mutation testing | **Stryker Mutator** | Latest | `@stryker-mutator/jest-runner` + `@stryker-mutator/typescript-checker` |
| Coverage | **Jest** built-in (Istanbul) | — | `--coverage` flag, thresholds in `jest.config.ts` |
| Quality metrics | **ESLint** + **SonarQube** (optional) | Latest | Complexity, duplication, maintainability |

### Agent Skills & Test Orchestration Matrix

| Test Run Layer            | Primary Tool            | Orchestrating Agent Skill              | When It Executes                          |
|---------------------------|-------------------------|----------------------------------------|-------------------------------------------|
| **Unit Tests & Logic**    | Jest                    | `tdd-workflow`, `ai-regression-testing`| During development (TDD cycle) & pre-commit|
| **BDD / Gherkin**         | Cucumber + Playwright   | `verification-loop`                    | On feature completion before PR           |
| **QA / E2E Journeys**     | Playwright              | `browse`, `browser-qa`, `qa-only`      | Post-implementation & visual verification |
| **Code Quality & Linting**| ESLint / jscpd / ts-prune| `plankton-code-quality`               | Real-time on file writes                  |
| **Mutation Testing**      | Stryker Mutator         | `ai-regression-testing`, `review`      | Full quality check / CI gate              |
| **Completion Gate**       | Jest Istanbul / CI      | `delivery-gate`, `agent-self-evaluation`| Blocks task completion until all checks pass|

### Installation Commands

```bash
# Jest + Angular preset
npm i -D jest @types/jest jest-preset-angular ts-jest @angular-builders/jest

# Cucumber.js + Playwright for BDD
npm i -D @cucumber/cucumber @playwright/test playwright ts-node

# Playwright for E2E
npx playwright install

# Stryker Mutator
npm i -D @stryker-mutator/core @stryker-mutator/jest-runner @stryker-mutator/typescript-checker

# Quality metrics
npm i -D eslint @angular-eslint/schematics
```

---

## 2. Unit Tests (Jest)

Unit tests validate isolated logic: services, guards, utilities, component state machines. No DOM rendering unless testing component-specific behavior.

### 2A. Data Services (`core/data/`)

Each mock data service is a pure function over in-memory arrays — ideal for unit testing.

#### `MockGamesDataService` (`core/data/games/games-data.mock.spec.ts`)

| #   | Test Case                                                     | Setup                                  | Assertion                                      |
|:---:|---------------------------------------------------------------|----------------------------------------|------------------------------------------------|
| 1   | `getGames()` returns all active games                         | Seed 5 games, 1 soft-deleted           | Returns 5 games, excludes deleted              |
| 2   | `getGames({ tag: 'RPG' })` filters by tag                     | Seed games with mixed tags             | Returns only games with `'RPG'` in `tags[]`    |
| 3   | `getGames({ search: 'space' })` filters by title substring    | Seed `'Space Quest'`, `'Knight Tale'`  | Returns only `'Space Quest'` (case-insensitive)|
| 4   | `getGames({ tag: 'RPG', search: 'quest' })` combines filters  | Seed 4 games                           | Returns games matching both criteria           |
| 5   | `getGameById(id)` returns matching game                       | Seed known ID                          | Returns the correct `Game` object              |
| 6   | `getGameById('nonexistent')` returns `undefined`              | Empty seed                             | Returns `undefined`                            |
| 7   | `createGame(dto)` assigns `id`, `createdAt`, `updatedAt`      | Valid DTO                              | New game has generated fields                  |
| 8   | `updateGame(id, partial)` patches fields and refreshes timestamp| Existing game                        | Updated fields changed, `updatedAt` > original |
| 9   | `deleteGame(id)` sets `deletedAt` (soft delete)               | Existing game                          | `deletedAt` is a valid ISO timestamp           |
| 10  | `deleteGame(id)` — deleted game excluded from `getGames()`    | Delete then query                      | Deleted game not in results                    |

#### `MockLibraryDataService` (`core/data/library/library-data.mock.spec.ts`)

| #   | Test Case                                                    | Setup                                  | Assertion                                      |
|:---:|--------------------------------------------------------------|----------------------------------------|------------------------------------------------|
| 1   | `getLibrary(userId)` returns user's entries                  | Seed 3 entries for user A, 2 for user B| User A gets exactly 3                          |
| 2   | `addToLibrary(userId, gameId)` creates entry with `acquiredAt`| Valid IDs                             | Entry has `acquiredAt` timestamp, no `orderId` |
| 3   | `addToLibrary(userId, gameId, orderId)` includes `orderId`   | Valid IDs + orderId                    | Entry has `orderId` set                        |
| 4   | `isOwned(userId, gameId)` returns `true` when owned          | Existing entry                         | `true`                                         |
| 5   | `isOwned(userId, gameId)` returns `false` when not owned     | No matching entry                      | `false`                                        |

#### `MockOrdersDataService` (`core/data/orders/orders-data.mock.spec.ts`)

| #   | Test Case                                                     | Setup                                  | Assertion                                      |
|:---:|---------------------------------------------------------------|----------------------------------------|------------------------------------------------|
| 1   | `createOrder(userId, gameId)` snapshots `Game.price`          | Game with `price: 4.99`                | Order has `price: 4.99`, `status: 'confirmed'` |
| 2   | `createOrder` assigns `id` and `createdAt`                    | Valid inputs                           | Generated fields present                       |
| 3   | `getOrders(userId)` returns only that user's orders           | Seed orders for 2 users                | Correct count per user                         |

#### `MockUsersDataService` (`core/data/users/users-data.mock.spec.ts`)

| #   | Test Case                                                     | Setup                                  | Assertion                                      |
|:---:|---------------------------------------------------------------|----------------------------------------|------------------------------------------------|
| 1   | `getUser(id)` returns matching user                           | Seeded user                            | Returns correct `User`                         |
| 2   | `getUser('nonexistent')` returns `undefined`                  | No match                               | `undefined`                                    |

---

### 2B. Authentication (`core/auth/`)

#### `AuthService` (`core/auth/auth.service.spec.ts`)

| #   | Test Case                                                     | Assertion                                                                      |
|:---:|---------------------------------------------------------------|--------------------------------------------------------------------------------|
| 1   | Hydration: reads active session from `localStorage` on init   | `currentUser` signal has value immediately                                     |
| 2   | `login()` updates `currentUser` signal                        | Signal value matches logged-in user                                            |
| 3   | `login()` persists session to `localStorage`                  | `localStorage` has session key                                                 |
| 4   | `logout()` clears `currentUser` signal to `null`              | Signal is `null`                                                               |
| 5   | `logout()` removes session from `localStorage`                | `localStorage` session key is gone                                             |
| 6   | `isAuthenticated` computed signal is `true` when logged in    | `true`                                                                         |
| 7   | `isAuthenticated` computed signal is `false` when logged out   | `false`                                                                        |
| 8   | `isCreator` computed signal reflects `roles.includes('creator')`| `true` for creator, `false` for buyer-only                                   |

---

### 2C. Route Guards (`core/auth/*.guard.spec.ts`)

#### `authGuard`

| #   | Scenario                                                      | Expected                                                                       |
|:---:|---------------------------------------------------------------|--------------------------------------------------------------------------------|
| 1   | Unauthenticated user visits `/library`                        | `UrlTree` → `/login?returnUrl=%2Flibrary`                                      |
| 2   | Authenticated user visits `/library`                          | Returns `true`                                                                 |
| 3   | `returnUrl` preserves full path with query params             | `returnUrl` encodes `/games/123?tab=screenshots`                              |

#### `roleGuard`

| #   | Scenario                                                      | Expected                                                                       |
|:---:|---------------------------------------------------------------|--------------------------------------------------------------------------------|
| 1   | User with `roles: ['buyer']` visits `/studio`                 | `UrlTree` → `/catalog`                                                         |
| 2   | User with `roles: ['buyer', 'creator']` visits `/studio`      | Returns `true`                                                                 |
| 3   | User with `roles: ['creator']` visits `/studio`               | Returns `true`                                                                 |

#### `ownershipGuard`

| #   | Scenario                                                      | Expected                                                                       |
|:---:|---------------------------------------------------------------|--------------------------------------------------------------------------------|
| 1   | Creator edits own game (`ownerId === currentUser.id`)         | Returns `true`                                                                 |
| 2   | Creator edits another creator's game                          | `UrlTree` → `/catalog`                                                         |
| 3   | Non-existent game ID in route params                          | `UrlTree` → `/catalog`                                                         |

---

### 2D. Component State Machines

#### `DownloadButtonComponent` (`shared/ui/download-button/download-button.component.spec.ts`)

| #   | State         | Inputs                                                        | Expected Text   | Expected Behavior                                      |
|:---:|---------------|---------------------------------------------------------------|-----------------|--------------------------------------------------------|
| 1   | Anonymous     | `currentUser = null`, `game.price = 10`                       | `"Download"`    | Emits `loginRequired`                                  |
| 2   | Free + Unowned| `currentUser = {id:'1'}`, `game.price = 0`, `isOwned = false` | `"Download Free"`| Calls `addToLibrary()`, triggers download              |
| 3   | Paid + Unowned| `currentUser = {id:'1'}`, `game.price = 9.99`, `isOwned = false`| `"Buy $9.99"` | Opens `purchase-confirm-modal`                         |
| 4   | Owned         | `currentUser = {id:'1'}`, `isOwned = true`                    | `"Download"`    | Triggers direct download                               |
| 5   | Unavailable   | `game.deletedAt = '2026-01-01'`                               | `"Unavailable"` | Button `disabled = true`                               |

#### `GameFormComponent` Validation (`features/creator-studio/game-form/game-form.component.spec.ts`)

| #   | Field              | Input                                                         | Expected                                                                       |
|:---:|--------------------|---------------------------------------------------------------|--------------------------------------------------------------------------------|
| 1   | `title`            | `''` (empty)                                                  | Invalid — required                                                             |
| 2   | `title`            | `'AB'` (2 chars)                                              | Invalid — min 3                                                                |
| 3   | `title`            | 81 characters                                                 | Invalid — max 80                                                               |
| 4   | `title`            | `'Valid Title'`                                               | Valid                                                                          |
| 5   | `description`      | `'Short'` (5 chars)                                           | Invalid — min 10                                                               |
| 6   | `description`      | 2001 characters                                               | Invalid — max 2000                                                             |
| 7   | `tags`             | `[]` (empty)                                                  | Invalid — min 1 tag                                                            |
| 8   | `tags`             | 6 tags                                                        | Invalid — max 5 tags                                                           |
| 9   | `tags`             | `['A']` (1 char tag)                                          | Invalid — each tag min 2 chars                                                 |
| 10  | `price`            | `-1`                                                          | Invalid — min 0                                                                |
| 11  | `price`            | `4.999` (3 decimals)                                          | Invalid — max 2 decimal places                                                 |
| 12  | `price`            | `0`                                                           | Valid (free game)                                                              |
| 13  | `coverImageUrl`    | `'not-a-url'`                                                 | Invalid                                                                        |
| 14  | `samplePackageUrl` | `''`                                                          | Invalid — required                                                             |

#### `TagChipInputComponent` (`shared/ui/tag-chip-input/tag-chip-input.component.spec.ts`)

| #   | Test Case                                                     | Assertion                                                                      |
|:---:|---------------------------------------------------------------|--------------------------------------------------------------------------------|
| 1   | Adding a valid tag emits updated tag array                    | Tags array length increases by 1                                               |
| 2   | Removing a tag emits updated array without it                 | Tag is absent                                                                  |
| 3   | Adding a 6th tag is rejected                                  | Array stays at 5                                                               |
| 4   | Tag shorter than 2 chars is rejected                          | Tag not added                                                                  |
| 5   | Tag longer than 20 chars is rejected                          | Tag not added                                                                  |
| 6   | Duplicate tags are rejected                                   | Array unchanged                                                                |

---

## 3. Gherkin / BDD Tests (Cucumber.js + Playwright)

Behavior-driven specifications written in `.feature` files using Given/When/Then syntax. Step definitions use Playwright to automate browser interactions.

### 3A. Feature Files

#### `features/auth/login.feature`

```gherkin
Feature: User Authentication
  As a marketplace visitor
  I want to log in with my credentials
  So that I can download games and access my library

  Background:
    Given the marketplace is loaded with seeded data

  Scenario: Successful login with demo account
    Given I am on the login page
    When I click the "Alice" demo account pill
    Then I should be redirected to "/catalog"
    And the header should display "Alice" as the active user
    And the header should show a "Library" navigation link

  Scenario: Login preserves return URL
    Given I am an anonymous user on "/games/game_001"
    When I click the "Download" button
    Then I should be redirected to "/login" with returnUrl "/games/game_001"
    When I log in as "bob@nexora.io"
    Then I should be redirected back to "/games/game_001"

  Scenario: Registration with creator role
    Given I am on the register page
    When I fill in email "newuser@nexora.io" and display name "NewUser"
    And I toggle "I want to publish games"
    And I submit the registration form
    Then I should be redirected to "/catalog"
    And the header should show a "Creator Studio" navigation link

  Scenario: Request password reset link
    Given I am on the login page
    When I click "Forgot password?"
    Then I should be on "/forgot-password"
    When I enter email "alice@nexora.io" and click "Send Reset Link"
    Then I should see a confirmation message "Reset link sent!"
```

#### `features/catalog/browse-catalog.feature`

```gherkin
Feature: Game Catalog Browsing
  As a visitor
  I want to browse, search, and filter games
  So that I can discover games I want to download

  Background:
    Given the marketplace is loaded with seeded data
    And I am on the catalog page

  Scenario: Catalog displays all active games
    Then I should see 10 game cards
    And no soft-deleted games should be visible

  Scenario: Search by title substring
    When I type "space" in the search input
    Then the catalog should display only games with "space" in their title

  Scenario: Filter by tag chip
    When I click the "RPG" tag chip
    Then only games tagged "RPG" should be displayed

  Scenario: Combined search and tag filter
    When I type "quest" in the search input
    And I click the "RPG" tag chip
    Then only RPG games with "quest" in their title should be displayed

  Scenario: Clear filters restores full catalog
    Given I have an active "RPG" tag filter
    When I remove the "RPG" filter
    Then all 10 seeded games should be visible
```

#### `features/download/gated-download.feature`

```gherkin
Feature: Gated Download Flow
  As a user
  I want to download games through the gated purchase flow
  So that my ownership is tracked in my library

  Background:
    Given the marketplace is loaded with seeded data

  Scenario: Anonymous user is bounced to login on download
    Given I am not logged in
    And I navigate to a game detail page for a paid game "$4.99"
    When I click the download button
    Then I should be redirected to "/login" with a returnUrl to the game

  Scenario: Buyer acquires a free game
    Given I am logged in as "bob@nexora.io" (buyer)
    And I navigate to a game detail page for a free game
    When I click the "Download Free" button
    Then a library entry should be created for this game
    And a file download should be triggered
    And the button should change to "Download"

  Scenario: Buyer purchases a paid game
    Given I am logged in as "bob@nexora.io" (buyer)
    And I navigate to a game detail page for a paid game "$4.99"
    When I click the "Buy $4.99" button
    Then a purchase confirmation modal should appear showing "$4.99"
    When I click "Confirm Purchase"
    Then an order should be created with status "confirmed"
    And a library entry should be created
    And a file download should be triggered
    And the button should change to "Download"

  Scenario: Owned game shows direct download
    Given I am logged in as "bob@nexora.io" (buyer)
    And I own game "game_001"
    When I navigate to the detail page for "game_001"
    Then the button should display "Download"
    And clicking it should trigger a direct file download

  Scenario: Soft-deleted game shows unavailable
    Given I am logged in as a user who owns a soft-deleted game
    When I navigate to the detail page for that game
    Then the button should display "Unavailable"
    And the button should be disabled
```

#### `features/library/my-library.feature`

```gherkin
Feature: My Library
  As an authenticated user
  I want to view and manage my game library
  So that I can re-download games I own

  Background:
    Given the marketplace is loaded with seeded data
    And I am logged in as "bob@nexora.io" (buyer)

  Scenario: Library displays owned games
    Given Bob owns 3 games
    When I navigate to "/library"
    Then I should see 3 library entries
    And each entry should show a thumbnail, acquired date, and download button

  Scenario: Download from library
    When I navigate to "/library"
    And I click "Download" on an owned game
    Then a file download should be triggered

  Scenario: Soft-deleted game in library
    Given Bob owns a soft-deleted game
    When I navigate to "/library"
    Then the soft-deleted game should show "Unavailable" with a disabled button
```

#### `features/studio/creator-studio.feature`

```gherkin
Feature: Creator Studio
  As a creator
  I want to manage my game listings
  So that I can publish and update games on the marketplace

  Background:
    Given the marketplace is loaded with seeded data
    And I am logged in as "carol@nexora.io" (creator)

  Scenario: Studio lists only creator's own games
    When I navigate to "/studio"
    Then I should only see games where ownerId matches Carol's ID

  Scenario: Create a new game listing
    When I navigate to "/studio/games/new"
    And I fill in valid game details
    And I submit the form
    Then the game should appear in the studio listings
    And the game should appear in the public catalog

  Scenario: Edit an existing game listing
    When I navigate to "/studio"
    And I click "Edit" on one of my games
    And I change the title to "Updated Game Title"
    And I submit the form
    Then the game title should be updated in the catalog

  Scenario: Soft-delete a game listing
    When I navigate to "/studio"
    And I click "Delete" on one of my games
    And I confirm the deletion in the modal
    Then the game should be removed from the studio listings
    And the game should not appear in the public catalog

  Scenario: Buyer cannot access Creator Studio
    Given I am logged in as "bob@nexora.io" (buyer only)
    When I navigate to "/studio"
    Then I should be redirected to "/catalog"
```

#### `features/support/support-help.feature`

```gherkin
Feature: Help & Support Center
  As a marketplace visitor or buyer
  I want to view frequently asked questions, submit support tickets, and review privacy policies
  So that I can resolve issues and understand data safety on the platform

  Background:
    Given the marketplace is loaded with seeded data

  Scenario: Browse FAQ accordion items
    When I navigate to "/support"
    Then I should see the FAQ list
    When I click on the question "Are games DRM-free?"
    Then the accordion should expand to show the DRM-free answer

  Scenario: Submit a support ticket as an anonymous user
    Given I am not logged in
    When I navigate to "/support"
    And I fill in "Name" with "John Doe"
    And I fill in "Email" with "john@nexora.io"
    And I fill in "Subject" with "Download question"
    And I fill in "Message" with "How do I extract the zip package?"
    And I click "Submit Ticket"
    Then I should see a success confirmation banner with a simulated ticket ID

  Scenario: Auto-populate user info for logged-in users
    Given I am logged in as "alice@nexora.io"
    When I navigate to "/support"
    Then the "Name" input should be pre-filled with "Alice"
    And the "Email" input should be pre-filled with "alice@nexora.io"

  Scenario: View Privacy & Data Trust Notice
    When I navigate to "/support"
    Then I should see the "Privacy & Data Trust Notice" section
    And it should detail local browser storage, 100% mock transactions, and DRM-free delivery
```

#### `features/genres/genres.feature`

```gherkin
Feature: Genre Directory Browsing
  As a marketplace visitor
  I want to browse games by genre and category
  So that I can quickly find games matching my taste

  Background:
    Given the marketplace is loaded with seeded data

  Scenario: View all available genres with game counts
    When I navigate to "/genres"
    Then I should see category cards for "RPG", "Platformer", "Puzzle", "Sci-Fi", "Cyberpunk"
    And each genre card should display the total count of active games

  Scenario: Filter catalog by clicking a genre card
    Given I am on "/genres"
    When I click on the "RPG" category card
    Then I should be redirected to "/catalog?tag=RPG"
    And the catalog grid should only display games tagged with "RPG"
```

#### `features/wishlist/wishlist.feature`

```gherkin
Feature: Wishlist and Bookmarks
  As an authenticated buyer
  I want to save games to my wishlist
  So that I can purchase or download them later

  Background:
    Given the marketplace is loaded with seeded data
    And I am logged in as "alice@nexora.io"

  Scenario: Bookmark a game to wishlist
    Given I am on "/catalog"
    When I click the heart icon on "Neon Dash"
    Then "Neon Dash" should be added to my wishlist
    When I navigate to "/wishlist"
    Then I should see "Neon Dash" in my saved games list

  Scenario: Remove a game from wishlist
    Given "Neon Dash" is in my wishlist
    When I navigate to "/wishlist"
    And I click the heart icon on "Neon Dash"
    Then "Neon Dash" should be removed from my wishlist

  Scenario: Anonymous user prompted to log in for wishlist
    Given I am an anonymous user
    When I navigate to "/wishlist"
    Then I should be redirected to "/login?returnUrl=/wishlist"
```

#### `features/creator/creator-portfolio.feature`

```gherkin
Feature: Creator Portfolio Storefront
  As a marketplace visitor
  I want to view a developer's public profile and game catalogue
  So that I can explore other titles made by that creator

  Background:
    Given the marketplace is loaded with seeded data

  Scenario: Navigate to creator profile from game detail
    Given I am on "/games/game_001"
    When I click the link "Created by Carol"
    Then I should be on "/creators/usr_carol"
    And I should see Carol's avatar, bio, and "[ Creator ]" badge
    And I should see all 4 games published by Carol
```

---

## 4. QA / E2E Tests (Playwright)

End-to-end tests that drive the full application in a real browser. These verify integrated behavior, visual correctness, and cross-browser compatibility.

### 4A. Critical User Journeys

#### Journey 1: Complete Gated Download Bounce (`e2e/journeys/gated-download-bounce.spec.ts`)

```
1. Navigate to /catalog as anonymous
2. Click a paid game card → /games/:id
3. Click "Download" → redirect to /login?returnUrl=/games/:id
4. Login as Bob → redirect back to /games/:id
5. Button shows "Buy $4.99" → click it
6. Modal appears → click "Confirm Purchase"
7. Verify: order created, library entry created, download triggered
8. Button shows "Download" (re-downloadable)
9. Navigate to /library → game is listed
10. Click "Download" in library → download triggers
```

#### Journey 2: Creator Publishing Lifecycle (`e2e/journeys/creator-lifecycle.spec.ts`)

```
1. Login as Carol (creator)
2. Navigate to /studio → see existing listings
3. Click "New Game" → /studio/games/new
4. Fill in game form with valid data → submit
5. Verify game appears in /studio and /catalog
6. Click "Edit" on new game → /studio/games/:id/edit
7. Update title → submit
8. Verify updated title in /catalog
9. Click "Delete" → confirm modal → soft delete
10. Verify game gone from /catalog but still in library for owners
```

#### Journey 3: Multi-Role Session Switching (`e2e/journeys/session-switching.spec.ts`)

```
1. Login as Bob (buyer) → verify buyer-only header nav
2. Navigate to /library → verify access
3. Manually navigate to /studio → verify redirect to /catalog
4. Logout → verify session cleared
5. Login as Alice (dual: buyer + creator) → verify full nav
6. Access /studio → verify access granted
7. Access /library → verify access granted
```

#### Journey 4: Error Simulation (`e2e/journeys/error-simulation.spec.ts`)

```
1. Append ?simulateErrors=true to catalog URL
2. Verify error state renders (ErrorMessageComponent)
3. Click retry → verify recovery attempt
```

### 4B. Responsive Layout Tests (`e2e/responsive/`)

| Test | Mobile (<768px) | Desktop (≥768px) |
|------|-----------------|-------------------|
| Catalog grid | 1 column | Multi-column grid |
| Header nav | Hamburger menu | Inline links |
| Game detail | Stacked layout | 2-column side-by-side |
| Creator Studio table | Horizontally scrollable | Full table visible |

### 4C. Cross-Browser Matrix

| Browser | Viewport | Tests |
|---------|----------|-------|
| Chromium | 1280×720, 375×667 | All journeys + responsive |
| Firefox | 1280×720 | All journeys |
| WebKit | 1280×720, 375×667 | All journeys + responsive |

---

## 5. Quality Metrics

### 5A. Static Analysis (ESLint)

Enforce Angular-specific lint rules via `@angular-eslint`:

| Rule Category | Key Rules |
|---------------|-----------|
| Component architecture | `no-input-rename`, `no-output-rename`, `use-lifecycle-interface` |
| Template safety | `template-accessibility-alt-text`, `template-no-negated-async` |
| Code hygiene | `no-unused-vars`, `no-explicit-any`, `prefer-const` |
| Complexity | `max-lines-per-function: 50`, `complexity: 10` |

### 5B. Code Quality Dashboard

Track and report these metrics after each test run:

| Metric | Target | Tool |
|--------|--------|------|
| **Cyclomatic complexity** | ≤ 10 per function | ESLint `complexity` rule |
| **Code duplication** | < 3% | `jscpd` or SonarQube |
| **Max file length** | ≤ 300 lines | ESLint `max-lines` |
| **Max function length** | ≤ 50 lines | ESLint `max-lines-per-function` |
| **TypeScript strict mode** | `strict: true` | `tsconfig.json` |
| **No `any` types** | 0 occurrences in `src/app/` | ESLint `@typescript-eslint/no-explicit-any` |
| **Test-to-code ratio** | ≥ 1:1 (lines of test ≥ lines of source) | Custom script |
| **Dead code** | 0 unused exports | `ts-prune` |

### 5C. Reporting

Generate an HTML quality report after each run:

```bash
# Lint report
npx eslint src/app/ --format html -o reports/eslint-report.html

# Duplication report
npx jscpd src/app/ --reporters html --output reports/duplication/

# Coverage report (generated by Jest)
# Located in coverage/lcov-report/index.html
```

---

## 6. Mutation Testing (Stryker Mutator)

Mutation testing validates that your tests actually catch bugs — not just that they execute code.

### 6A. Configuration (`stryker.config.mjs`)

```javascript
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  mutate: [
    'src/app/core/**/*.ts',
    '!src/app/core/**/*.spec.ts',
    '!src/app/core/**/*.mock.ts',
    'src/app/shared/ui/download-button/**/*.ts',
    '!src/app/shared/ui/download-button/**/*.spec.ts',
    'src/app/features/creator-studio/game-form/**/*.ts',
    '!src/app/features/creator-studio/game-form/**/*.spec.ts',
  ],
  testRunner: 'jest',
  jest: {
    configFile: 'jest.config.ts',
  },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },
  thresholds: {
    high: 90,
    low: 80,
    break: 75,
  },
  timeoutMS: 60000,
};
```

### 6B. Mutation Targets (Priority Order)

| Priority | Target | Why |
|----------|--------|-----|
| **P0** | `core/auth/*.guard.ts` | Security-critical branching — a surviving mutant here means an auth bypass |
| **P0** | `core/auth/auth.service.ts` | Session state logic — mutations in signal updates = silent auth bugs |
| **P1** | `core/data/games/games-data.mock.ts` | Filtering and soft-delete logic — wrong results served to users |
| **P1** | `core/data/library/library-data.mock.ts` | Ownership check — false ownership = unauthorized downloads |
| **P1** | `core/data/orders/orders-data.mock.ts` | Price snapshot — mutant could charge wrong amount |
| **P2** | `shared/ui/download-button/` | 5-state machine — mutant could show wrong button state |
| **P2** | `features/creator-studio/game-form/` | Validation logic — mutant could allow invalid game data |

### 6C. Mutation Score Thresholds

| Level | Score | Action |
|-------|-------|--------|
| ✅ High | ≥ 90% | Pass — tests are strong |
| ⚠️ Low | 80–89% | Warning — review surviving mutants |
| ❌ Break | < 75% | **Build fails** — tests are not catching bugs |

---

## 7. Test Coverage Enforcement

### 7A. Tiered Coverage Strategy Rationale

Rather than mandating a blanket 100% global code coverage (which leads to test pollution, testing trivial boilerplate/getters, and false confidence), the project employs a **Tiered Coverage Strategy**:

- **100% Functions on Security-Critical Modules (`core/auth/` & `core/data/`)**: Every guard, auth branch, and mock data function is strictly tested.
- **90% Global Minimum Baseline**: Enforces comprehensive test coverage across the entire codebase while avoiding junk assertions.
- **Mutation Testing Defense**: Stryker Mutation Score (≥90% target, ≥75% build break) ensures that covered lines actually detect logical bugs and mutations, delivering true test strength rather than vanity metrics.

### 7B. Jest Coverage Configuration (`jest.config.ts`)

```typescript
export default {
  // ... other config
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.module.ts',
    '!src/app/**/index.ts',
    '!src/app/environments/**',
  ],
  coverageThresholds: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
    // Strict 100% function coverage on security-critical authentication
    'src/app/core/auth/': {
      statements: 95,
      branches: 95,
      functions: 100,
      lines: 95,
    },
    // Strict 100% function coverage on data abstraction layer
    'src/app/core/data/': {
      statements: 95,
      branches: 90,
      functions: 100,
      lines: 95,
    },
  },
};
```

### 7C. Per-Layer Coverage Targets

| Layer | Statements | Branches | Functions | Lines | Key Focus |
|-------|-----------|----------|-----------|-------|-----------|
| `core/auth/` | **95%** | **95%** | **100%** | **95%** | Guards, returnUrl logic, session signals |
| `core/data/` | **95%** | **90%** | **100%** | **95%** | CRUD operations, soft-delete, filtering |
| `shared/ui/` | **90%** | **90%** | **90%** | **90%** | 5-state download button, tag chips |
| `features/` | **85%** | **85%** | **85%** | **85%** | Reactive forms, UI component orchestration |
| **Global Baseline** | **90%** | **90%** | **90%** | **90%** | Full repository minimum |

---

## 8. Directory Structure

```
project-root/
├── src/app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.service.spec.ts         ← Unit
│   │   │   ├── auth.guard.spec.ts           ← Unit
│   │   │   ├── role.guard.spec.ts           ← Unit
│   │   │   └── ownership.guard.spec.ts      ← Unit
│   │   └── data/
│   │       ├── games/games-data.mock.spec.ts
│   │       ├── library/library-data.mock.spec.ts
│   │       ├── orders/orders-data.mock.spec.ts
│   │       └── users/users-data.mock.spec.ts
│   ├── shared/ui/
│   │   ├── download-button/download-button.component.spec.ts
│   │   ├── tag-chip-input/tag-chip-input.component.spec.ts
│   │   └── game-card/game-card.component.spec.ts
│   └── features/
│       └── creator-studio/
│           └── game-form/game-form.component.spec.ts
│
├── e2e/                                      ← Playwright E2E
│   ├── playwright.config.ts
│   ├── journeys/
│   │   ├── gated-download-bounce.spec.ts
│   │   ├── creator-lifecycle.spec.ts
│   │   ├── session-switching.spec.ts
│   │   └── error-simulation.spec.ts
│   ├── responsive/
│   │   ├── catalog-responsive.spec.ts
│   │   └── header-responsive.spec.ts
│   └── fixtures/
│       └── test-data.ts
│
├── bdd/                                      ← Cucumber.js + Playwright BDD
│   ├── features/
│   │   ├── auth/login.feature
│   │   ├── catalog/browse-catalog.feature
│   │   ├── download/gated-download.feature
│   │   ├── library/my-library.feature
│   │   └── studio/creator-studio.feature
│   ├── step-definitions/
│   │   ├── auth.steps.ts
│   │   ├── catalog.steps.ts
│   │   ├── download.steps.ts
│   │   ├── library.steps.ts
│   │   └── studio.steps.ts
│   └── support/
│       ├── world.ts                          ← Playwright browser context
│       └── hooks.ts                          ← Before/After lifecycle
│
├── reports/
│   ├── eslint-report.html
│   ├── duplication/
│   ├── mutation/index.html
│   └── cucumber-report.html
│
├── coverage/                                 ← Jest Istanbul output
│   └── lcov-report/index.html
│
├── jest.config.ts
├── stryker.config.mjs
└── .eslintrc.json
```

---

## 9. NPM Scripts

```jsonc
// package.json (scripts section)
{
  "scripts": {
    // === Unit Tests ===
    "test":              "jest",
    "test:watch":        "jest --watch",
    "test:coverage":     "jest --coverage",
    "test:ci":           "jest --coverage --ci --reporters=default --reporters=jest-junit",

    // === BDD / Gherkin ===
    "test:bdd":          "cucumber-js --require-module ts-node/register --require bdd/step-definitions/**/*.ts bdd/features/**/*.feature",
    "test:bdd:report":   "cucumber-js --format json:reports/cucumber-report.json && node scripts/cucumber-html-report.js",

    // === E2E / QA ===
    "test:e2e":          "playwright test",
    "test:e2e:ui":       "playwright test --ui",
    "test:e2e:headed":   "playwright test --headed",
    "test:e2e:report":   "playwright show-report",

    // === Quality Metrics ===
    "lint":              "eslint src/app/ --ext .ts,.html",
    "lint:report":       "eslint src/app/ --ext .ts,.html --format html -o reports/eslint-report.html",
    "quality:duplication":"jscpd src/app/ --reporters html --output reports/duplication/",
    "quality:deadcode":  "ts-prune src/app/",
    "quality:all":       "npm run lint && npm run quality:duplication && npm run quality:deadcode",

    // === Mutation Testing ===
    "test:mutate":       "stryker run",
    "test:mutate:report":"stryker run && open reports/mutation/index.html",

    // === Full Suite ===
    "test:all":          "npm run test:coverage && npm run test:bdd && npm run test:e2e && npm run quality:all && npm run test:mutate"
  }
}
```

---

## 10. CI Integration Notes

### Recommended Pipeline Order

```
1. npm run lint              → Static analysis gate (fast-fail)
2. npm run test:ci           → Unit tests + coverage enforcement
3. npm run test:bdd          → Gherkin BDD acceptance tests
4. npm run test:e2e          → Playwright E2E across browser matrix
5. npm run quality:all       → Duplication + dead code checks
6. npm run test:mutate       → Mutation testing (slowest — run last)
```

### Failure Criteria

| Stage | Fails If |
|-------|----------|
| Lint | Any ESLint error (warnings allowed) |
| Unit Tests | Any test failure OR coverage < 90% |
| BDD | Any Cucumber scenario fails |
| E2E | Any Playwright test fails |
| Quality | Duplication > 3% OR dead code detected |
| Mutation | Mutation score < 75% (break threshold) |

---

## Related Documentation

- [Existing Test Plan (Unit Specs)](test-plan.md) — Original unit test specs for guards and download button
- [Data Models Reference](reference-data-models.md) — Model constraints and validation rules
- [API Services Reference](reference-api-services.md) — Service method signatures
- [Routes & Guards Reference](reference-routes-guards.md) — Route table and auth matrix
- [Frontend Architecture](../frontend-architecture.md) — Full architectural context

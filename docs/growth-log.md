# NEXORA Development Growth Log & Pattern Extract

## [Pattern] Standalone Angular 18 DI Token Abstraction with LocalStore Persistence

### Context
- Building a full-featured cyberpunk and indie game marketplace with mock persistence, reactive auth signals, and multi-route public storefront.
- Need to ensure UI components are 100% decoupled from mock data services so that swapping to real HTTP REST APIs requires 0 template or component changes.

### Root Cause / Core Insight
- Direct service injection (`inject(MockGamesDataService)`) creates tight coupling. By defining explicit interfaces and `InjectionToken<T>` in `tokens.ts` (e.g. `GAMES_DATA`, `WISHLIST_DATA`, `LIBRARY_DATA`), all components interact solely with pure Observable/Signal contracts.
- Model ID naming must be consistent across seed data, tests, and route parameters (e.g., `game_001` vs `game-1`, `usr_alice` vs `usr-1`).

### The Pattern (Transferable)
- Next time building prototype or full-stack frontend applications with mock data layers, define `InjectionToken<T>` interfaces upfront in `tokens.ts`, configure providers in `app.config.ts`, and test with Playwright end-to-end assertions against actual DOM IDs.
- Signal to recognize: Components needing data operations should never import concrete `Mock*` classes; they should only inject the corresponding `InjectionToken`.

---

## [Pattern] CSS Custom Property Theming with LocalStorage DOM Attribute Binding

### Context
- Added a dynamic **Light / Dark Mode** theme switcher with an iOS-style spring toggle.

### Root Cause / Core Insight
- Rather than maintaining separate stylesheets, defining a unified set of semantic tokens (`--bg-void`, `--bg-surface`, `--text-primary`, etc.) on `:root` and overriding them under `[data-theme="light"]` allows instant, flicker-free theme switching with zero DOM restructuring.

### The Pattern (Transferable)
- Use a dedicated `ThemeService` with an Angular Signal (`currentTheme`) that immediately applies `document.documentElement.setAttribute('data-theme', theme)` in its constructor and updates `localStorage`.
- Signal to recognize: Any new component styling should use CSS variables exclusively instead of hardcoded hex values (`#000`, `#FFF`).

---

## [Pattern] Hardware Acceleration Resilience & CSS Paint Containment

### Context
- When users disable Hardware Accelerated GPU Scheduling (HAGS) or run on software rasterizers, rapid card mutations during search/filtering can cause layout jank and paint flicker.

### Root Cause / Core Insight
- Browser layout trees recalculate the entire DOM tree when sub-elements resize or re-render.
- By applying `contain: paint layout` to individual cards (`.game-card`) and `contain: layout` to grid containers (`.game-grid`), Blink/Gecko isolates layout calculations to isolated subtrees.
- Adding `decoding="sync"` to thumbnail images prevents asynchronous decode flash on image replacements.

### The Pattern (Transferable)
- On dynamic list views and repeated grid items, always specify `contain: paint layout;` and fixed image container aspect ratios (`aspect-ratio: 16/9;`).
- Remove artificial synthetic delays (`delay(80)`) from in-memory mock services to achieve instantaneous 0.0ms rendering.

---

## [Pattern] Symmetrical Apple iOS Toggle Switch with Vector SVGs

### Context
- Emoji toggles (`☀️` / `🌙`) suffer from OS glyph variations, scaling jank, and sub-pixel displacement on hover.

### Root Cause / Core Insight
- Unequal left vs right travel gaps cause visual offset in one state.
- Symmetrical geometry formula:
  - Track: `48px × 26px` (border: 1px)
  - Knob: `20px × 20px` with `top: 2px; left: 2px`
  - Dark Mode translation: `translateX(22px)` leaves an exact 2.0px margin on all 4 sides in both states.
  - Absolute positioning (`left: 6px`, `right: 6px`) for background SVG icons avoids flexbox layout shifts.

---

## [Pattern] Multi-Tiered Automated Testing Harness (Unit, Integration & Playwright E2E)

### Context
- Ensuring continuous functional stability, early defect detection, and fearless refactoring.

### Root Cause / Core Insight
- Testing at only one level creates blind spots: unit tests don't catch visual CSS overlap or broken routing links; E2E tests are slower to write for granular data validation.
- Combining a sub-second in-memory domain test runner (`comprehensive-unit-and-integration.spec.ts` — 20/20 PASS) with a comprehensive headless Playwright browser interaction audit (`audit-all-pages-and-buttons.ts` — 56/56 PASS) delivers 100% test confidence with $< 5$s total runtime.

### The Pattern (Transferable)
- Run `npx tsx src/app/core/tests/comprehensive-unit-and-integration.spec.ts` for rapid unit & integration checks.
- Run `npx ts-node src/app/core/tests/audit-all-pages-and-buttons.ts` for full browser UI interaction audits across all routes.

---

## [Pattern] Decoupled Native Event Binding over Heavy Two-Way Binding in Standalone Components

### Context
- In modern standalone Angular components, importing heavy form modules (`FormsModule`) for simple search inputs or lightweight forms can introduce unnecessary package overhead and IDE language server cache mismatches.

### Root Cause / Core Insight
- Lightweight components only require one-way property binding (`[value]="searchTerm"`) and native event dispatch (`(input)="onSearchInput($event)"`).
- Handling state updates via small, explicit helper methods (`onDisplayNameChange`, `onCreatorToggle`) satisfies the Single Responsibility and Interface Segregation principles (SOLID), avoids external two-way binding directives, and ensures zero IDE diagnostic warnings.

### The Pattern (Transferable)
- For search inputs and simple forms in standalone components, prefer native event binding (`(input)`, `(change)`, `(submit)`) with focused handlers over importing `FormsModule`.

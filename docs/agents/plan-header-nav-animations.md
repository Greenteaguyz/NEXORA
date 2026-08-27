# Implementation Plan: Header Nav Moving Indicator + Mobile Drawer Animation

**Status:** Implemented
**Revision:** 2 (2026-08-27) — final tuned values supersede §5.1 draft: drawer timing split into `DRAWER_ENTER_MS=360` / `DRAWER_EXIT_MS=240` (asymmetric), stagger cap 260ms, section keyframes 340ms. Exit path and race-safety logic unchanged.
**Repo:** NEXORA — Angular 18 standalone storefront (see `AGENTS.md`, the single source of truth)

---

## 0. How to use this document

Read `AGENTS.md` first (working agreement, quality gate, design rules). Then build exactly what
Section 5 specifies. Sections 6–9 define done. Do not redesign the approach — the architectural
decisions in Section 4 were made against the current codebase; deviation requires re-reading the
risks in Section 7.

Run all verification from repo root. Everything is npm-script based; no Karma/Jasmine — the test
tiers are standalone TypeScript runners under `tests/`.

---

## 1. Goal

The desktop header tabs (Store, Genres, Library, Wishlist, Orders, Creator Studio) get a sliding
active-tab indicator that glides between tabs, and the mobile navigation drawer gets smooth
open **and** close animations (today closing is an instant DOM removal), with staggered content
entrance.

## 2. Scope

**In scope**
- Desktop nav (`.desktop-nav` / `.nav-links`): moving active-tab underline indicator.
- Mobile drawer (`.mobile-backdrop`, `.mobile-drawer`): animated exit, refined enter,
  staggered section entrance, focus restore on close.
- Component CSS/TS/HTML in `src/app/layout/header/` only, plus test additions described in §8.
- `prefers-reduced-motion` and SSR safety for all new behavior.

**Out of scope (do not touch)**
- Mobile bottom bar (`<768px`) — it already has transitions.
- Header hide-on-scroll logic, command palette, theme switcher, wishlist badge.
- Any other component, route, or service. No refactors beyond what §5 requires.
- Hover-driven indicator preview (indicator tracks the *active* tab only — recorded decision).

## 3. Discovered facts (verified in repo — trust these, they are current)

| Fact | Where |
| --- | --- |
| Desktop nav markup; tabs are conditional: Store+Genres always; Library/Wishlist/Orders when `authService.isAuthenticated()`; Creator Studio when `isCreator()` | `src/app/layout/header/header.component.html:13-52` |
| Active style is a static per-tab `border-bottom: 2px solid var(--accent-400)` + bg tint; `transition: all 0.2s ease` | `src/app/layout/header/header.component.css:96-130` |
| `.desktop-nav` is `display: none` at ≤1024px | `header.component.css:988-1006` |
| Drawer is wrapped in `@if (mobileMenuOpen())` — mounts instantly, so only an *enter* animation exists (`drawerSlideIn` 0.22s `cubic-bezier(0.16, 1, 0.3, 1)`); close = instant unmount | `header.component.html:160-358`, `header.component.css:596-623, 969-977` |
| Backdrop fade-in only: `backdropFadeIn 0.2s ease` | `header.component.css:579-594` |
| `mobileMenuOpen` signal drives scroll lock, focus-to-close-button (50ms), Escape close, Tab focus trap, and the header hide-on-scroll guard | `header.component.ts:26-29, 64-125, 146-167` |
| Drawer CSS is saturated with `!important` (historical specificity battles) — preserve them; change only what §5 lists | `header.component.css:579-634` |
| Motion rules: "Fast & Snappy 0.15s ease; zero wobbly rubber-band spring curves"; never `cubic-bezier(0.34, 1.56, 0.64, 1)`; `prefers-reduced-motion` bypasses transforms (0.01ms) | `DESIGN.md:16, 140, 180` |
| Global reduced-motion block exists | `src/styles.css:338` |
| Header already uses non-overshooting `cubic-bezier(0.16, 1, 0.3, 1)` (drawer, header slide) — reuse this curve; overshoot curves (any y > 1) are banned | `header.component.css:14, 277, 614` |
| Unit test harness: standalone TS runner, `assert(suite, name, condition, error?)` helper, numbered console sections | `tests/unit/unit-tests.spec.ts:6-23` |
| Quality gate commands: `npm run test:impeccable` (design compliance, required for CSS changes), `npm run verify` (build + unit + integration + master battery + impeccable) | `AGENTS.md` |

Routes that leave **no** desktop tab active (indicator must hide): `/profile`, `/support`,
`/login`, `/register`, `/studio` children are fine (`/studio` has its own tab).

## 4. Architecture decisions (pre-made — build these, not alternatives)

**D1 — Indicator is JS-measured, signal-driven, progressive enhancement.**
A CSS-only per-tab underline cannot *travel* between tabs. One absolutely-positioned
`<span class="nav-active-indicator">` lives inside `.nav-links`; an Angular `effect()` reads a
signal combo (URL + auth + creator state), measures the `.active` anchor after render (rAF), and
writes `translateX`/`width`. If measurement is impossible (SSR, nav hidden, no active tab), the
indicator is absent/invisible and the tab still reads as active via its color/background — the
underline is never the only active cue. **Replace** the static `border-bottom` on
`.nav-item a.active` with the indicator (do not keep both — double underline).

**D2 — Drawer exit animation via mount/open dual-signal, CSS transitions (not keyframes).**
`@if` unmounts instantly, so: `drawerMounted` (in DOM?) is separated from `mobileMenuOpen`
(visible?). Open: mount → rAF → add open class. Close: remove open class (transition plays) →
unmount after the transition duration via a tracked timeout. The keyframe enter animations are
converted to two-state class transitions so enter and exit share one code path. `mobileMenuOpen`
keeps its current meaning for scroll lock / focus trap / header-hidden guard — those semantics do
not change.

**D3 — Stagger via class-scoped keyframes + pure delay helper.**
Entrance stagger applies only while `.drawer-open` is present, re-running each open. A pure
exported helper computes delays so it is unit-testable.

**D4 — Motion vocabulary (fixed, token-compliant):**
- Curve: `cubic-bezier(0.16, 1, 0.3, 1)` (already in this file) for drawer + indicator.
- Durations: drawer exit `240ms` / enter `400ms` (asymmetric — `DRAWER_EXIT_MS` /
  `DRAWER_ENTER_MS`; the unmount timer tracks the *exit* only), indicator `250ms`,
  backdrop `200ms ease` (as today), stagger step `35ms`, total stagger cap `260ms`.
- No `translateY` on any nav/link/container (grounded hover rule), no overshoot, no blur.

## 5. Implementation steps

### 5.1 `header-animations.ts` (NEW — pure logic, zero Angular imports)

Create `src/app/layout/header/header-animations.ts`. Standalone-testable; `tests/unit` imports it directly without any Angular runtime:

```ts
export const DRAWER_ENTER_MS = 400;        // gentler ease-in-out S-curve, see §5.3
export const DRAWER_EXIT_MS = 240;         // must match the closed-state .mobile-drawer transition duration
export const UNMOUNT_FALLBACK_MS = 100;    // grace period past the CSS exit duration
export const STAGGER_STEP_MS = 35;
export const STAGGER_CAP_MS = 260;
export function staggerDelay(index: number, step = STAGGER_STEP_MS, cap = STAGGER_CAP_MS): number;

export interface IndicatorGeometry { x: number; width: number }
export function computeIndicatorGeometry(
  containerWidth: number,
  tabs: Array<{ left: number; width: number } | null>
): IndicatorGeometry | null;   // containerWidth <= 0 → null; first non-null tab wins; none → null

export interface DrawerTimer {
  setTimeout(handler: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

/** Kills the rapid open↔close race via a generation counter: any supersede
    (re-open, destroy) invalidates pending unmount callbacks and timers. */
export class DrawerCloseScheduler {
  constructor(timers: DrawerTimer);
  cancelPendingUnmount(): void;                                  // called on open
  scheduleUnmount(onUnmount: () => void): void;                  // called on close; fires after DRAWER_EXIT_MS + UNMOUNT_FALLBACK_MS at the latest
  completeIfExiting(): boolean;                                  // called from drawer transitionend (propertyName === 'transform') while closed — unmounts now, clears fallback timer
  destroy(): void;                                               // ngOnDestroy
}
```

The component uses the global timers by default; unit tests inject fake timers.

### 5.2 `header.component.ts`

1. Add `drawerMounted = signal(false)`. Own one `DrawerCloseScheduler` instance.
2. Rework open/close (preserving existing side effects):
   - Open path (`toggleMobileMenu` → `openMobileMenu`): `closeScheduler.cancelPendingUnmount()` **first** (this is the race killer); store `document.activeElement` as `drawerReturnFocus` (browser-guarded); scroll lock on; if not mounted: `drawerMounted.set(true)` then set `mobileMenuOpen.set(true)` inside a **double** `requestAnimationFrame` (two frames must pass so the off-screen mount state is fully committed before `.drawer-open` lands — a single rAF lets the class land in the same paint cycle and produces a ragged start); if re-opening mid-exit: set `mobileMenuOpen.set(true)` directly (element exists; transition reverses from current position). Keep the existing 50ms focus-to-`.btn-close-drawer`.
   - `closeMobileMenu()`: guard `if (!mobileMenuOpen()) return` (no-op during exit); `mobileMenuOpen.set(false)` immediately (starts exit + releases scroll lock now); `drawerReturnFocus?.focus()` then null it; `closeScheduler.scheduleUnmount(() => drawerMounted.set(false))`.
   - Template binds `(transitionend)` on the aside → `onDrawerTransitionEnd(event)`: if `event.propertyName === 'transform' && !mobileMenuOpen()` → `closeScheduler.completeIfExiting()` (primary unmount path; the timer is only a fallback for missed events).
   - `ngOnDestroy`: `closeScheduler.destroy()` (keep existing body-overflow reset).
3. Nav indicator state + measurement:
   - Signals: `navIndicatorX = signal(0)`, `navIndicatorW = signal(0)`, `navIndicatorVisible = signal(false)`, `navIndicatorNoAnim = signal(true)`.
   - Inject `PLATFORM_ID` + `ElementRef`; measurement behind `isPlatformBrowser`.
   - Constructor `effect()` deps: `currentUrl()`, `authService.isAuthenticated()`, `authService.isCreator()` → `scheduleIndicatorMeasure()` (coalesced: one rAF per frame via a `indicatorMeasureQueued` flag).
   - `measureIndicator()`: query `.nav-links` and its `li a` children **via `elementRef.nativeElement`** (no global `document.querySelector` — avoids cross-component bleed); find the `active` anchor; pass container `offsetWidth` + `{left, width}` per tab to `computeIndicatorGeometry`; set signals; `null` → `navIndicatorVisible.set(false)`.
   - **First-paint priming (deterministic, one rAF):** CSS gates all transitions behind `.is-visible:not(.no-anim)`. First successful measure sets x/w while `no-anim` is still true (untransitioned), then a single rAF flips `no-anim → false` and `visible → true` together — the transform value is identical between those frames, so a slide-in is impossible; only the opacity fade plays. Subsequent measures skip priming.
   - `@HostListener('window:resize')` → `scheduleIndicatorMeasure()`.
4. Do **not** add `ChangeDetectionStrategy.OnPush` or refactor unrelated members.

### 5.2 `header.component.html`

1. Inside `.nav-links` (after the `@if` blocks, last child of the `<ul>`):
   ```html
   <span class="nav-active-indicator"
         [class.no-anim]="indicatorNoAnim()"
         [style.transform]="'translateX(' + navIndicatorX() + 'px)'"
         [style.width.px]="navIndicatorW()"
         [class.is-visible]="navIndicatorVisible()"
         aria-hidden="true"></span>
   ```
   (`indicatorNoAnim` = `!indicatorPrimed` exposed as a readonly signal, or fold priming into
   `navIndicatorVisible` logic — implementer's choice, keep it signal-driven.)
2. Drawer block: change the wrapper from `@if (mobileMenuOpen())` to `@if (drawerMounted())`,
   and bind state classes:
   ```html
   <div class="mobile-backdrop" [class.backdrop-visible]="mobileMenuOpen()" (click)="closeMobileMenu()"></div>
   <aside class="mobile-drawer" [class.drawer-open]="mobileMenuOpen()" ...>
   ```
   Everything inside the aside stays identical.
3. Stagger: on each `.nav-group-section` and `.drawer-footer-card`, bind
   `[style.animation-delay.ms]="staggerDelay(i)"` — expose the sections as an index in the
   template (e.g., wrap the four sections in `@for` over a static descriptor array, or apply
   `ngClass`/inline delays manually with indices 0..3 in source order: Discovery, Management &
   Activity, Studio, Account & Help, then footer card last). Keep the DOM output semantically
   identical to today (same elements, same conditional `@if`s).

### 5.3 `header.component.css`

1. `.nav-links { position: relative; }`
2. New indicator block (place near the `.nav-item a.active` rules):
   ```css
   .nav-active-indicator {
     position: absolute;
     bottom: -2px;            /* replaces the old static border-bottom position */
     left: 0;
     height: 2px;
     width: 0;
     border-radius: 2px;
     background: var(--accent-400);
     box-shadow: 0 1px 6px rgba(102, 192, 244, 0.35); /* subtle, matches existing active glow */
     opacity: 0;
     transform: translateX(0);
     transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                 width 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                 opacity 0.2s ease;
     pointer-events: none;
     will-change: transform;
   }
   .nav-active-indicator.is-visible { opacity: 1; }
   .nav-active-indicator.no-anim { transition: none; }
   :host-context([data-theme="light"]) .nav-active-indicator {
     background: #0284C7;
     box-shadow: 0 1px 4px rgba(2, 132, 199, 0.25);
   }
   ```
3. `.nav-item a.active`: **remove** `border-bottom` and the `inset 0 -1px 0` shadow line; remove the
   now-pointless top-only `border-radius` override; keep color/background/font-weight. Same for
   the light-theme override block (`header.component.css:125-130`): keep color/bg, drop its
   `border-bottom`.
4. Drawer two-state transition — replace `animation: drawerSlideIn ...` / `animation: backdropFadeIn ...`
   (keep every existing `!important` on these selectors):
   ```css
   .mobile-backdrop {
     /* existing props unchanged, plus: */
     opacity: 0 !important;
     visibility: hidden !important;
     pointer-events: none !important;
     transition: opacity 0.2s ease, visibility 0s linear 0.2s !important;
   }
   .mobile-backdrop.backdrop-visible {
     opacity: 1 !important;
     visibility: visible !important;
     pointer-events: auto !important;
     transition: opacity 0.2s ease, visibility 0s linear 0s !important;
   }

   .mobile-drawer {
     /* existing props unchanged, replace the animation line with:
        0.24s here = DRAWER_EXIT_MS (closed/exit state) */
     transform: translateX(100%) !important;
     visibility: hidden !important;
     transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                 visibility 0s linear 0.24s !important;
   }
   .mobile-drawer.drawer-open {
     transform: translateX(0) !important;
     visibility: visible !important;
     /* 0.4s = DRAWER_ENTER_MS, gentler ease-in-out S-curve; no overshoot */
     transition: transform 0.4s cubic-bezier(0.55, 0.06, 0.18, 0.96),
                 visibility 0s linear 0s !important;
   }
   ```
   The `translate3d`/`backface-visibility` GPU hints already on `.mobile-drawer` stay. Delete the
   now-unused `@keyframes drawerSlideIn` and `@keyframes backdropFadeIn` (verify nothing else
   references them first with a grep).
5. Stagger keyframes (new):
   ```css
   @keyframes drawerSectionIn {
     from { opacity: 0; transform: translateX(16px); }
     to   { opacity: 1; transform: translateX(0); }
   }
   .drawer-open .nav-group-section,
   .drawer-open .drawer-footer-card {
     animation: drawerSectionIn 0.4s cubic-bezier(0.55, 0.06, 0.18, 0.96) both;
     /* per-element delay comes from the inline animation-delay binding in 5.2 */
   }
   ```
   `both` + delay prevents pre-animation flash. Only animates while `.drawer-open` exists, so it
   naturally re-runs on each open and does not affect the exit.
6. Reduced motion (component-level, even though a global block exists — do not rely on it):
   ```css
   @media (prefers-reduced-motion: reduce) {
     .nav-active-indicator,
     .mobile-drawer,
     .mobile-backdrop { transition-duration: 0.01ms !important; transition-delay: 0s !important; }
     .drawer-open .nav-group-section,
     .drawer-open .drawer-footer-card { animation: none; }
   }
   ```

### 5.4 Tests

1. `tests/unit/unit-tests.spec.ts` — new numbered section "Header Navigation Animation Logic"
   using the existing `assert()` helper, importing `computeIndicatorGeometry`, `staggerDelay`,
   `DrawerCloseScheduler`, and the timing constants from `header-animations.ts`:
   - geometry: returns `{x, width}` of the active (first non-null) tab; returns `null` when
     `containerWidth <= 0` (nav hidden); returns `null` when no tab is active; x/width come from
     the provided tab (not hardcoded offsets).
   - stagger: `staggerDelay(0) === 0`; increases with index; capped at `STAGGER_CAP_MS`
     (`staggerDelay(99)` === cap); `DRAWER_EXIT_MS === 240 && DRAWER_ENTER_MS === 400`.
2. Grep `tests/` for `.mobile-drawer`, `drawer-open`, `mobile-backdrop`, `nav-item` and
   `mobileMenuOpen`. The drawer previously vanished the instant `mobileMenuOpen` flipped — any
   test asserting absence immediately after a close click must now wait
   `DRAWER_EXIT_MS + ~50ms` (or poll). Playwright journeys auto-wait for hidden and should
   pass unchanged; verify rather than assume, and update only what actually breaks.
3. No changes to `tests/audit/broken-links-crawler.spec.ts` — no new routes or click targets.

## 6. Acceptance criteria

- **AC-001 — Active tab indicator renders aligned.** Scenario: desktop ≥1024px, user on `/wishlist`
  (authenticated). Expected: 2px cyan underline spanning exactly the Wishlist tab's horizontal
  bounds at the bottom of the nav row; the old static per-tab border-bottom is gone. Verification:
  manual review + Playwright screenshot or geometry assertion.
- **AC-002 — Indicator glides between tabs.** Scenario: desktop, click Store → Genres → Library.
  Expected: single indicator slides horizontally between tab positions in ~250ms; no jump-cut, no
  duplicate indicators. Verification: manual + e2e if practical.
- **AC-003 — Indicator re-syncs when the tab set or layout changes.** Trigger: login/logout
  (tabs appear/disappear) and window resize while a tab is active. Expected: indicator snaps to
  the correct new position; never floats over a gap or off-nav position. Verification: manual both
  ways + unit tests on `computeIndicatorGeometry`.
- **AC-004 — Indicator hides when no tab is active.** Scenario: navigate to `/profile` or
  `/support`. Expected: indicator fades out; tab row shows no underline. Verification: manual.
- **AC-005 — Drawer closes with a smooth exit.** Trigger each of: backdrop click, Escape key,
  nav-link navigation, logout, persona switch. Expected: drawer slides right in 240ms + backdrop
  fades 200ms, then unmounts; body scroll unlocks immediately at close start. Verification:
  manual on <1024px viewport; Playwright close journey stays green.
- **AC-006 — Rapid toggling is stable.** Trigger: open→close→open quickly (≤300ms), repeated.
  Expected: drawer ends in the correct final state, no stuck half-open drawer, no leaked timers
  (no unmount mid-open). Verification: manual spam-test + code review of timer clearing.
- **AC-007 — Staggered entrance on open only.** Expected: sections slide in with 35ms steps
  (capped 260ms) each time the drawer opens; nothing animates on close. Verification: manual.
- **AC-008 — Reduced motion honored.** Scenario: OS reduced-motion enabled. Expected: indicator,
  drawer, backdrop transitions ≈0.01ms; stagger disabled; drawer still opens/closes instantly and
  unmounts. Verification: manual (devtools emulation) + CSS review.
- **AC-009 — SSR/build safety.** `npm run verify` builds clean; no `window`/`document` access on
  server path (measurement is `isPlatformBrowser`-guarded). Verification: build in `npm run verify`.
- **AC-010 — Focus management preserved/improved.** Open → focus lands on close button (existing);
  Tab cycles inside drawer while open (existing trap); after close, focus returns to the element
  that opened the drawer; Escape during exit animation is a no-op (no error). Verification:
  manual keyboard pass.
- **AC-011 — Unit tests for new logic.** New section in `tests/unit/unit-tests.spec.ts` covering
  geometry + stagger + duration constant, all passing. Verification: `npm run test:unit`.
- **AC-012 — Quality gate green.** `npm run test:impeccable` and `npm run verify` pass; failing
  pre-existing tests unrelated to this change are reported, not silently patched.

## 7. Risks & mitigations (do not skip the mitigations)

| Risk | Mitigation (already baked into §5) |
| --- | --- |
| Dual-signal drawer breaks scroll lock / focus trap / header-hidden semantics | `mobileMenuOpen` keeps its exact meaning; only mounting is new; trap + Escape already gate on `mobileMenuOpen()`, which is false during exit |
| Close timer fires during a re-open, unmounting the open drawer | Timer cleared on every open path and in `ngOnDestroy` (§5.1.3) |
| Indicator slides from x=0 on first load | Priming pass: position set with `no-anim` class, revealed after two rAFs (§5.1.5) |
| Measurement runs before `.active` class or layout settles | rAF after effect; deps on URL + auth + creator; resize listener (§5.1.5) |
| SSR/prerender crash on `document`/layout APIs | `isPlatformBrowser` guard; component keeps current `typeof document` guards |
| Tests assume instant drawer unmount | §5.4.2 grep + targeted waits |
| Design non-compliance (spring curves, lift, neon blur, double underline) | §4 fixes the motion vocabulary; static underline removed; `test:impeccable` in the gate |
| `!important` web in drawer CSS causes specificity regressions | Keep existing importants; only swap animation lines for transitions |

## 8. Verification plan

| Step | Command / action | Covers |
| --- | --- | --- |
| 1 | `npm run test:unit` | AC-011 |
| 2 | `npm run test:impeccable` | design compliance (mandatory — CSS changed) |
| 3 | `npm run test:integration` | drawer selector timing (AC-005) |
| 4 | `npm start` + manual pass: desktop nav glide (AC-001–004), mobile drawer open/close/stagger (AC-005–007), reduced-motion emulation (AC-008), keyboard pass (AC-010) | UX criteria |
| 5 | `npm run verify` | full gate (AC-009, AC-012) |

Report format (per `AGENTS.md`): pass/fail per tier + updated test counts.

## 9. Hard constraints (violating any of these fails the task)

1. Zero overshoot/spring curves — no `cubic-bezier` with any y-value > 1.
2. Zero `translateY` lift on nav links, tabs, indicator, or drawer controls.
3. No raw emojis; inline SVG only (none needed here — adds none).
4. Only the three header component files + `tests/unit/unit-tests.spec.ts` (+ test fixes forced
   by §5.4.2) may change. No file deletions. No dependency additions.
5. All browser APIs behind platform guards; app must stay SSR-safe.
6. Stagger/animations must never delay interaction: links are clickable immediately on open.

# NEXORA — Session Handoff (2026-08-29)

Context for the next AI session. All work below is COMMITTED and PUSHED to `origin/main`
(head = `32820bf`). `npm run verify` was green (469/469 unit · 51/51 integration ·
23/23 master battery · 7/7 impeccable) on the exact pushed tree.

## What this session delivered (13 commits, 2f6f1da..32820bf)

| Commit | Content |
| --- | --- |
| `e9f6c24` | Hotfix A: ref-counted ScrollLockService + `[appScrollLock]` directive wired into 15 fullscreen overlays (purchase modal, command palette, account-payment modals, header drawer, game-detail lightbox + 4 modals, library/wishlist confirm modals, orders receipt, profile modals, studio unpublish). `position:fixed` body technique for iOS; scroll save/restore + scrollbar compensation. |
| `c965c7b` | Wishlist card feedback: toasts on add/remove, new `warning` toast severity (amber token + triangle SVG), fullscreen remove-confirm modal on catalog cards. |
| `ac7c4c3` | Phase 0: vercel.json caching (hashed bundles + /assets immutable 1y; / and /index.html no-cache) + `docs/performance-baseline.md` (initial bundle 667.31 kB raw / 135.84 kB transfer). |
| `64febbf` | Phase 1: `sanitizeReturnUrl` util (blocks `//`, schemes, backslash); guards redirect with `?reason=` params (`auth-required` / `creator-required` / `not-owner`); root component maps reason params to info/warning/error toasts and strips the param. |
| `4fca5f8` | Toast severity auto-hide tiers (success 3.5s / info+download 4s / warning 5s / error 7s), pause-on-hover/focus via `pause(id)/resume(id)`, optional `action` payload with UNDO button (double-fire guarded). |
| `fcc6ae1` | Phase 2: ExpiryDateDirective (MM/YY auto-slash, caret-safe), CardNumber grouping + CVV directives came later (see `92d44b4`), pending states (`claiming`) on free-claim/download paths, wishlist-to-library sync on ALL library-entry paths, toasts on purchase/claim/library-remove/studio-unpublish. |
| `0515f8d` | Phase 3: heart `:active` press feedback (card 0.92, detail 0.97). |
| `db0cff4` | Phase 4: catalog URL sync (`syncUrl()` replaceUrl, compare-before-assign loop guard), debounced search, conditional footer links (auth/creator), back-to-top button (offset clears download tray), carousel focusin/visibilitychange/reduced-motion pause. |
| `8c6a6ea` | Phase 5: intent deep links (`?intent=purchase|download`, param stripped, title re-assert after strip nav), dynamic document title + OG meta per game, not-found -> redirect `/catalog?reason=game-not-found`, load-error state with in-page Retry, expiry validation split (malformed -> "Use MM/YY format" vs expired). |
| `fa8471e` | Phase 6: CanDeactivate unsaved-changes guard on both studio form routes (`unsaved-changes.guard.ts`, `hasUnsavedChanges()` + `justSaved` + `markAsPristine()` after edit-load), buyer-impact copy in unpublish modal, 16px input floor at 480px. |
| `830132b` | Thumbnail strip: `repeat(auto-fit, minmax(clamp(64px, 9vw, 96px), 1fr))` — row fills 100%, thumbs borderless with opacity selection (0.55 inactive / 0.8 hover / 1 active), continuous width across the 640px breakpoint (the ≤640 flex override was REMOVED — do not reintroduce, it caused a 64↔137px width jump). |
| `92d44b4` | CardNumberDirective (4-digit grouping, caret-safe) + CvvDirective (numeric, cap 4) wired with inputmode/autocomplete; `groupCardNumber` pure helper; clearer card-number validation wording; Owned badge on catalog cards (per-card `LIBRARY_DATA.isOwned`, emerald `.price-badge.owned`); toast queue: cap 3 visible (oldest evicted via leaving state), identical-toast dedupe with timer reset, `leaving` lifecycle with exit transition (EXIT_MS 180); mis-click prevention: whole-card dismissal REMOVED (close only via 44px ✕ or auto-expiry), 250ms spawn grace on close/undo, hover-lift removed from toast card. |
| `32820bf` | Profile cleanup: demo "System Reset" bar + modal + TS removed entirely (intentional — do not re-add without asking), avatar glow-ring removed (anti-slop), Wallet stat card shows live `formatUsd(balance)` via `PAYMENTS_DATA.getWalletSnapshot`, missing `.stat-icon-wrap.emerald` style added, single-line stat labels, container gap tokenized. |

## Key architecture facts for the next AI

- **Toast system** (`toast.service.ts`): `show(payload, durationMs?)` with severity defaults;
  `timers`/`deadlines`/`pausedRemaining` maps; `dismiss()` marks `leaving: true` then removes
  after 180ms — tests must await ~250ms after dismiss before asserting removal.
  Dedupe key = type+title+message. Cap = 3 (`maxVisible`).
- **Scroll lock**: `ScrollLockService` is ref-counted; the ≤640px thumbnail flex override was
  removed on purpose (breakpoint continuity). Thumbnail strip = one auto-fit grid rule.
- **Guard reasons**: `?reason=` values are stripped by the root listener after toasting —
  add new reasons to the `switch` in `app.component.ts` `reportGuardRejection()`.
- **Catalog URL sync**: `syncUrl()` uses `replaceUrl: true`; the `route.queryParams`
  subscription compares-before-assign — don't write params with values that already match.
- **Testing**: `npm run verify` = build + unit + integration + master battery + impeccable.
  Master battery runs in PURE NODE (no DOM): services only, `TestBed` needs the DOM-free
  harness setup already in `master-test-battery.ts`. Timing tests use real sleeps (120-250ms)
  and can be flaky if you shrink them.
- **Known pre-existing quirks** (not fixed, by scope decision): esbuild warning
  `.form-floating>~label`; expiry validation message wording split shipped but the
  wallet-balance stat is per-session origin (4310 vs 4300 have separate localStorage).

## Environment gotchas hit this session

- **In-app browser pane tiling bug**: the pane occasionally renders the page tiled/duplicated
  (2×2). DOM/geometry stay clean — it's a compositor bug, NOT app CSS. Fix: nudge viewport
  size (`setViewportSize`) or reload. Do not hunt for CSS causes.
- **Browser automation cell cancellations**: every new user message cancels an in-flight
  `node_repl` call — keep browser cells short (<60s) and atomic.
- **Two dev servers ran during the session**: 4300 (user's) and 4310 (fallback). localStorage
  is per-origin — sessions/auth state differ between them.
- **Native confirm() dialogs** (CanDeactivate guard) are auto-handled by the automation
  harness inconsistently (sometimes accept, sometimes dismiss) — assert navigation outcome,
  not dialog presence.

## Intentionally deferred / removed

- Download button state machine expansion — deferred by user (do not add paused/queued states).
- Demo "System Reset" bar — removed at user request (full cleanup). The TS reset logic was
  removed with it; `localStore.clearAll()` / `gamesData.resetToDefaultSeed()` still exist in
  core if a hidden admin path is ever wanted.
- Live badge update on wishlist mutation (header badge refetches per user id only) — deferred.
- Checkout modal clarity improvements — deferred.

## Session state side effects (4310 origin)

- Logged in as **Alice Vance** (creator).
- Demo artifact: unpublished game "Automation Test Game" (`game_mte3cu00kvu`) exists in
  Alice's studio list (soft-deleted, by design; no hard delete exists).
- Bob's wishlist on 4310 was restored to empty; Bob owns game_002 (seed), game_003 (claimed
  during testing), game_004 (E2E purchase test, $59.99 Visa order) — mock data, kept.

## Verification commands

- `npm run verify` — full gate (must pass, zero failures)
- `npm run test:e2e` — Playwright journeys (exists; not run this session)
- Deploy note: Vercel caching headers active on next deploy; verify hashed assets return
  `cache-control: immutable`.


## ADDENDUM — post-push batch (pending commit at handoff time; commits created after this doc was written)

The following was completed AFTER the initial push and committed as a follow-up batch:

1. **Card input UX**: `CardNumberDirective` (`groupCardNumber`, 4-digit grouping, caret-safe) +
   `CvvDirective` (numeric, cap 4) wired on account-payment with inputmode/autocomplete;
   validation wording "Enter a valid 16-digit card number". Pure helper `groupCardNumber` in
   payment-logic (battery-tested).
2. **Owned badge**: catalog cards show "Owned" (emerald `.price-badge.owned`) instead of price
   via per-card `LIBRARY_DATA.isOwned`. Detail page already had "IN LIBRARY".
3. **Toast queue + mis-click prevention**: cap 3 (oldest evicted via `leaving` state), identical-
   toast dedupe with timer reset, 180ms exit transition (`.toast-leaving`), whole-card dismissal
   removed (44px close button only), 250ms spawn grace on close/undo, hover-lift removed.
4. **Profile cleanup**: demo System Reset bar + modal + TS removed (intentional; core reset
   methods still exist in services), avatar glow-ring removed (anti-slop), wallet stat card
   shows live `formatUsd(balance)` with "Wallet Balance" label, missing `.emerald` tile style
   added, single-line stat labels, gap tokenized.
5. **Drag restyle** (game-form): overlay now light accent tint `rgba(102,192,244,0.10)` (was
   82% black + blur), hint text in a `.drop-hint-pill` dark pill, drag-active state is
   color-only (accent border + `box-shadow: 0 0 0 3px rgba(102,192,244,0.15)` — the EXACT
   Support focus recipe; outline approach removed; overflow:hidden does NOT clip own
   box-shadow), overlay fade 0.2s ease.
6. **Studio actions alignment + compaction**: ACTIONS column left-aligned (was text-right —
   caused Edit x-position to vary per row), `.btn-action` padding 5px 12px, cluster gap 6px.

### Root-cause lesson (important)
User-reported "jank/instant transitions" traced to the environment: `prefers-reduced-motion:
reduce` is ON in the user's browser/OS, and styles.css' global reduced-motion block forces all
transitions to 0.01ms. The app is CORRECT to honor it. Before hunting CSS for "not smooth"
reports, check `matchMedia('(prefers-reduced-motion: reduce)')` first. User was advised to
enable Windows Animation effects to see shipped animations.

### Battery growth
23/23 suites: added Card Number Grouping + Toast Queue (cap/dedupe/leaving) suites; toast
tests updated for the leaving lifecycle (await ~250ms post-dismiss).

# NEXORA — Project Directives & Autonomous Protocol

## 1. System Intent & Architecture
Desktop-grade Steam-inspired storefront and creator platform in Angular 18 (Standalone, `OnPush`, Signals, `@if`/`@for`).
- `src/app/core/` — Reactive stores (`signal()`, `computed()`), persistence (`local-store.service.ts`), auth/guards, seed data.
- `src/app/features/` — Pages (`game-catalog`, `game-detail`, `library`, `wishlist`, `orders`, `creator-studio`, `account-payment`, `profile`).
- `src/app/layout/` & `src/app/shared/ui/` — Shell, navigation, modals, toasts, trays, bento cards.

---

## 2. Cognitive Loop & Reasoning Order (Mandatory State Machine)
Every non-trivial prompt MUST follow this 4-step sequence before changing state:

```
[1. DELIBERATE] -> [2. MAP & PLAN] -> [3. SURGICAL EXEC] -> [4. VERIFY & POLISH]
```

### Stage 1: Deliberate (Karpathy "Think Before Coding")
- **Assumptions**: State premise explicitly; never assume ambiguous specifications silently.
- **Tradeoffs & Pushback**: Always evaluate if a simpler native Angular approach exists. Push back on overengineering.
- **Minimalism (`ponytail`)**: YAGNI first. Reuse existing signal stores and utilities. **Zero new NPM packages**.

### Stage 2: Map & Plan
- **Blast Radius**: Trace impacted callers and dependents via `npm run graft -- callers <Symbol> --depth 2` or `code-review-graph`.
- **Scope Contract (`intent-layer`)**: Define strict boundaries, observable state changes (`AC-NNN`), and prohibited side effects.
- **Subagent Delegation**:
  - *Planning phase*: Delegate investigation and blast radius to `research`, `architect`, or `planner`.
  - *Artifact constraint*: Plans MUST be written to Antigravity brain (`<appDataDir>\brain\<conversation-id>/implementation_plan.md`), **never** to `.claude/plans/`.

### Stage 3: Surgical Execution
- **Subagent Registry**:
  - *Allowed*: `self`, `research`, `planner`, `architect`, `typescript-reviewer`, `code-reviewer`, `build-error-resolver`, `e2e-runner`, `performance-optimizer`, `a11y-architect`.
  - *Prohibited*: `DeepCoder`, `code-explorer`, `code-architect`, `tdd-guide`, `security-reviewer`.
- **Worker Allocation**: Delegate drafting chunks to subagents (`Model: "flash"` or specialized roles); integrate as Lead Architect.
- **Zero Drift**: Touch **only** task-relevant lines. Never touch adjacent formatting, unrelated comments, or orthogonal logic.

### Stage 4: Verify & Polish
- **Pre-Gate Review**: Invoke `code-reviewer` or `typescript-reviewer` on modified diffs.
- **State Tracing**: Run `click-path-audit` on shared state stores and buttons.
- **Quality Gate**: Run `npm run verify` (build + 687 unit + 324 integration + 23 master + 7 impeccable tests). **0 failures allowed**.

---

## 3. Invariants & Hard Constraints
- **Zero raw emojis**: Inline SVGs with `viewBox` and `aria-*` only. No emojis (🎮, ✔, 🗑).
- **Grounded hover**: 0px container `translateY`; no floating lift effects.
- **No AI slop**: Zero neon blur halos, zero wobbly spring curves, zero pill utility buttons.
- **Action-first headers**: Use `Play [Title]`, `Buy [Title]`.
- **SSR Safety**: Guard `window`/`localStorage` with `isPlatformBrowser(platformId)`.
- **Multi-Persona Isolation**: `local-store.service.ts` reactively isolates creator (Alice) vs buyer (Bob) state.
- **Subscriptions**: Bound all RxJS observables using `takeUntilDestroyed()`.
- **O(1) Lookups**: Use `Map` indexed by `id` on hot query paths instead of `Array.find`.
- **Font Stack Ordering**: Primary Latin fonts (`Plus Jakarta Sans`) must precede localized non-Latin script fonts (`Suwannaphum`, `Noto Sans Khmer`) to prevent glyph hijacking.
- **Dropdown Listeners**: Call `event.stopPropagation()` on toggle buttons to prevent document click listeners from instantly collapsing open trays.

---

## 4. Operational Tooling
- `npm run verify` — Primary quality gate. Must pass before completing any coding turn.
- `npm run graft -- <cmd>` — Graph queries (`map`, `ask "<q>" --source`, `callers <sym> --depth 2`, `skeleton <file>`).
- Standalone Node test runners compile via `tsc --skipLibCheck` into `dist/`.
- Communication style: Terse, high signal-to-noise (`caveman`), zero conversational filler.

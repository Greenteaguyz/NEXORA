# NEXORA — Project Memory & Agent Directives

## Architecture & Tech Stack
- **Framework**: Angular 18 (Standalone Components, Signals, `OnPush` Change Detection, `@if` / `@for` control flow)
- **Styling**: Vanilla CSS with custom properties (`src/styles.css`), following Steam DesignMD specification in `DESIGN.md`
- **Testing**: Playwright (`@playwright/test`, `@axe-core/playwright`), TypeScript standalone runners
- **Build & Verification Command**: `npm run verify`

---

## ⚡ MANDATORY AUTO-INVOCATION PROTOCOL (NO USER PERMISSION REQUIRED)

The agent MUST automatically execute this full quality and maintenance lifecycle on every turn without waiting for user permission:

### 1. Before Execution & While Inquiring (Planning, SWOT, IDD, Wayfinder & Risk Protocol)
- **Mandatory SWOT Analysis**: Before touching production code, when formulating implementation plans, OR whenever asking questions / soliciting user design feedback, ALWAYS conduct and present a structured **SWOT Analysis** (Strengths, Weaknesses, Opportunities, Threats) embedded directly in the message and `implementation_plan.md`.
- **Mandatory IDD & Wayfinder Protocol**: During any planning or roadmap discussion, ALWAYS auto-invoke `/intent-driven-development` (defining observable Acceptance Criteria `AC-NNN` with clear start/action/outcome/forbidden conditions) and `/wayfinder` (4-step discovery: goal deconstruction, spike isolation, risk synthesis, and implementation handoff).
- **Mandatory Pre-Flight Risk Elimination**: Formulate and embed concrete engineering solutions that eliminate identified risks down to 0.0% residual risk prior to execution.
- **Grounded Hover & Category Pill Standards**: Enforce 0px container `translateY` on interactive cards/buttons, Plus Jakarta Sans typography on category filter pills, Electric Cyan (`#66C0F4`) luminous active states, and inline numeric count badges.

### 2. During Tasks (In-Flight Guardrails)
- **Component / Service / Store**: Auto-invoke `angular-signals-best-practices` (`signal()`, `computed()`, `input()`, `output()`, `OnPush`, `takeUntilDestroyed()`).
- **UI / Modals / Forms / Navigation**: Auto-invoke `a11y-standards-auditor` (WCAG AAA 7:1 contrast, ARIA states, keyboard traps, roving tabindex).
- **Images / Media / Routes**: Auto-invoke `web-perf-cwv` (`ngSrc` + `priority`, `aspect-ratio: 16/9`, `loading="lazy"`, chunk budgets < 250KB).
- **Game Grids / Catalog Traversal**: Auto-invoke `spatial-navigation-ux` (2D arrow-key traversal, Steam focus indicators with `--accent-400`).
- **CSS / Styling**: Auto-run `/impeccable audit` (strict `DESIGN.md` tokens, zero neon blur, zero spring curves, zero pill buttons on utility actions).
- **Shared State / Signal Stores / Buttons with multi-step handlers**: Auto-invoke `click-path-audit` (trace every touchpoint through its full state change sequence; detect Sequential Undo, Async Race, Stale Closure, Missing State Transition, and Conditional Dead Path patterns).
- **Playwright E2E Tests / New User Journeys**: Auto-invoke `e2e-testing` (Page Object Model structure, `data-testid` locators, `waitForResponse` over `waitForTimeout`, retry/quarantine patterns for flaky tests, CI artifact management).

### 3. After Every 1–2 Tasks (Automated Test Expansion, Cleanup & Quality Gate)
Immediately upon finishing 1–2 tasks or feature additions and BEFORE concluding the turn:
1. **Auto-Update & Expand Tests (`tdd-workflow` / `ai-regression-testing`)**:
   - **Logic & Validations**: Automatically add unit tests to `tests/unit/unit-tests.spec.ts` for all new methods, computations, input limits, and edge cases.
   - **Links & User Paths**: Update `tests/audit/broken-links-crawler.spec.ts` to crawl all new routes, buttons, and click destinations.
   - **Navigation & Redirects**: Add integration tests to `tests/integration/integration-tests.spec.ts` and E2E journeys to `tests/e2e/e2e-user-journeys.spec.ts` for route guards, redirects, and state sync.
   - **Click-Path State Audits**: After any feature touching shared signal stores (wishlist, cart, library, orders, auth), auto-run `click-path-audit` to map state store side-effects and trace every handler for Sequential Undo / Async Race / Dead Path bugs.
   - **E2E Best Practices**: When authoring or updating Playwright journeys, auto-apply `e2e-testing` patterns (Page Object Model, `data-testid` locators, `waitForResponse` instead of `waitForTimeout`, flaky test quarantine).
2. **Auto-Prune & Clean Unnecessary Files**:
   - Automatically identify and delete obsolete, duplicate, or temporary test scripts, outdated specs, and unused files to prevent workspace and context bloat.
3. **Design Compliance**: Auto-run `/impeccable audit`
4. **Build & Regression Verification**: Auto-run `npm run verify` (all assertions must pass 100% green)
5. **Auto-Remediation**: If anything fails, fix it immediately and re-run until 100% green
6. **Self-Assessment**: Run `agent-self-evaluation` (5-axis scorecard)
7. **Report Proof**: Always include test pass/fail results and updated test counts in the final response

### 4. End of Session
- Run `/save-session` to save state for `/resume-session`

# PRD: Creator Mode Modal Dot Removal, Microcopy Streamlining & CLS Stress Testing

## Problem
In the User Profile ([`/profile`](http://localhost:4200/profile)) Creator Mode deactivation confirmation modal:
1. **Extraneous Status Indicator Dot (`●`)**: The countdown pill includes a circular pulsing indicator dot (`.countdown-pulse-dot`) that creates visual clutter and resembles an online status LED rather than an industrial countdown timer.
2. **Microcopy Punctuation**: Trailing periods on single-line UI descriptions (`Hides Creator Studio from your navigation.`) make the microcopy feel overly formal rather than clean and modern.
3. **Potential Layout Shift (Failure Case)**: Without the circular dot and without a stabilized width, the transition from `"Wait 1s to confirm"` to `"Ready to confirm"` could cause Cumulative Layout Shift (CLS) as text width changes.

## Evidence
- User directive: *"remove the dot in the pop message /plan-prd let's discuss first ?"* and subsequent approval *"stress test failure case and fix it then review the work /plan-prd"*.
- Code audit:
  - `src/app/features/profile/profile.component.html:221-229`: Still contains `<span class="countdown-pulse-dot"></span>` and trailing period on `#disable-creator-desc`.
  - `src/app/features/profile/profile.component.css`: Retains `.countdown-pulse-dot` styles.

## Users
- **Primary**: Content creators and developers managing account settings on NEXORA.

## Hypothesis
We believe that **removing the circular pulse dot, centering the countdown label with a stabilized minimum width to eliminate CLS, dropping the trailing period on the single-line warning, and verifying zero-shift transitions under stress testing** will **deliver a sleek, desktop-grade Steam stopwatch feel while guaranteeing visual stability**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Indicator Dot Removal | 0 dot elements | Complete removal of `.countdown-pulse-dot` from template & styles |
| Visual Jitter / CLS | 0px layout jump | Stabilized pill geometry (`min-width: 170px; justify-content: center`) |
| Negative Time Protection | Invariant: $\ge 0$ | Stress test confirming `countdownSeconds` never goes below 0 |
| Quality Gate | 100% GREEN | `npm run verify` (unit, integration, master battery, anti-slop) |

## Scope
**MVP**
1. **Remove Dot & Modernize Microcopy**:
   - Remove `<span class="countdown-pulse-dot">` from `profile.component.html`.
   - Remove `.countdown-pulse-dot` CSS rules from `profile.component.css`.
   - Center text horizontally in `.countdown-pill` with `justify-content: center` and `min-width: 172px`.
   - Change `"Hides Creator Studio from your navigation."` to `"Hides Creator Studio from your navigation"`.
2. **Defensive Hardening (Failure Case)**:
   - Ensure `this.countdownSeconds = Math.max(0, this.countdownSeconds - 1);` so negative countdowns are mathematically impossible under race conditions.
3. **Stress Testing**:
   - Add integration tests verifying dot absence, layout stability invariant, and bounded countdown range under 1,000 rapid cycles.

**Out of scope**
- Changing base countdown duration (5 seconds).

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | PRD & Requirements Definition | Streamlined microcopy, dot removal, and CLS safety | complete | `.claude/prds/creator-mode-deactivation-polish.prd.md` |
| 2 | Implementation Plan | Map template, CSS, defensive TS guard, and stress test | pending | `implementation_plan.md` |
| 3 | Remove Dot & Stabilize Pill | Update HTML, CSS, and TS in `profile.component` | pending | — |
| 4 | Stress Test Suite & Fix Verification | Add integration tests covering failure cases | pending | — |
| 5 | Quality Gate Verification | Full `npm run verify` execution | pending | — |
| 6 | Walkthrough & Review | Final review of visual improvements and test results | pending | `walkthrough.md` |

---
*Status: DRAFT — requirements approved for implementation planning.*

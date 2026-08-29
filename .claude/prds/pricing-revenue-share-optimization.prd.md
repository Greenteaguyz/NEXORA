# PRD: Elimination of Over-Engineered Revenue Progress Bar & Streamlined Payout Badge

## Problem
In Section 2 ("Pricing & Distribution") of the game creation form ([`/studio/games/new`](http://localhost:4200/studio/games/new)), an over-engineered two-tone progress bar (`.revenue-progress-track`) is rendered underneath the revenue breakdown card.
This bar is fundamentally flawed:
1. **Static 0-Information Artifact**: Because NEXORA's creator revenue split is fixed at 90/10, the bar is permanently locked at 90% green / 10% grey regardless of the entered price. It conveys zero dynamic information.
2. **Visual Ambiguity with Readiness Meter**: Creators confuse this static 90/10 bar with the dynamic "Publish Readiness" progress bar in the right-hand sidebar.
3. **Over-Engineered Clutter**: Stacking a divided card (`revenue-split-card`) plus a progress bar (`revenue-progress-track`) beneath a simple number input is classic UI over-engineering.

## Evidence
- User observation and directive: *"the bar below the keep i think it's just over-engineered what do you think? /plan-prd /intent-layer"*.
- Code audit: `src/app/features/creator-studio/game-form/game-form.component.html:135-140` renders a hardcoded `[style.width]="'90%'"` fill that never calculates dynamic variance.

## Users
- **Primary**: Game creators who want a clean, honest, and clutter-free publishing interface that respects their intelligence and presents take-home numbers clearly.
- **Not for**: Public store visitors.

## Hypothesis
We believe that **completely deleting the static 90/10 progress bar and replacing the divided revenue card with a single sleek inline payout helper (`Est. payout: $8.99 (90% net)`)** will **eliminate visual confusion with the readiness checklist, remove unnecessary DOM nodes, and create a professional, grounded Steamworks-grade pricing tool**. We will know we are right when **the pricing section is clean, compact, and free of over-engineered widgets**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Over-Engineered Elements Removed | 100% (Bar deleted entirely) | Zero `.revenue-progress-track` in template & CSS |
| Vertical Height Saved | ~60px reclaimed | Layout measurement of Section 2 |
| Cognitive Load | 1 single take-home figure | Presence of clean `$X.XX (90% net)` helper |
| Quality Gate | 100% GREEN | `npm run verify` |

## Scope
**MVP**
1. **Delete the Over-Engineered Progress Bar**:
   - Permanently remove `.revenue-progress-track`, `.revenue-fill-creator`, and `.revenue-fill-platform` from HTML and CSS.
2. **Streamline into a Sleek Inline Helper**:
   - Replace the chunky divided `.revenue-split-card` with a clean, single-line payout badge:
     - For paid games: `✓ Est. creator payout: $8.99 (90% net)` (emerald mono `$8.99`).
     - For free games: `✓ Free to play (0% platform fee)`.
   - Remove the redundant `Platform fee (10%): $1.00` and `"/ copy"` text.
3. **Remove Footer Divider Line**:
   - Remove `border-top` from `.form-actions-footer.sticky`.
4. **Auto-Save Draft on Leave**:
   - Auto-persist dirty forms as private drafts when navigating away from `/studio/games/new`.

**Out of scope**
- Re-introducing animated sliders or charts for static math.

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | PRD & Intent Contract | Confirm deletion of over-engineered bar and streamline payout | complete | `.claude/prds/pricing-revenue-share-optimization.prd.md` |
| 2 | Implementation Plan | Detail exact code deletions and replacement | complete | `implementation_plan.md` |
| 3 | Code Execution | Remove bar, streamline payout text, remove footer line, add auto-save | pending | — |
| 4 | Verification | Run full quality gate (`npm run verify`) | pending | — |

---
*Status: APPROVED — Implementation pending via /plan.*

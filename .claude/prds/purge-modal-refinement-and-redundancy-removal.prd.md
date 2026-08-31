# Compact Purge Countdown Pill & Modal Redundancy Removal

## Problem
The newly added 5-second countdown safety lock on the "Permanently Delete" modal in Creator Studio successfully prevents accidental data destruction, but suffers from two ergonomic/visual drawbacks:
1. **Bulky Pill Geometry**: The `.countdown-pill` was carried over with generic large proportions (`min-width: 172px`, `padding: 6px 16px 10px 16px`, `font-size: 0.78rem`), dominating the modal body and appearing disproportionately large relative to the surrounding confirmation text.
2. **Redundant Boilerplate Copy**: The modal currently stacks three layers of redundant information:
   - Header: `Permanently Delete Game?`
   - Lead text: `Are you sure you want to permanently erase "{{ gameToPurge.title }}"?` (classic AI slop / boilerplate phrase forbidden by Steam DesignMD)
   - Warning box: `All media, screenshots, and metadata will be permanently wiped from storage. This action cannot be undone.`
   - Confirm button: `Permanently Delete`
   This triple repetition clutters the dialog and dilutes user focus during a high-stakes destructive interaction.

## Evidence
- User directive: *"make the pill shape smaller in the permanently delete game also delete what's redundant as well /plan-prd"*
- Profile benchmark: The "Turn Off Creator Mode" modal in `profile.component.html` avoids "Are you sure..." boilerplate entirely, using a concise single-line description and a clean status callout.
- Code audit: `creator-studio.component.html` lines 320–348 contain overlapping questions and descriptions, while `creator-studio.component.css` has oversized pill padding and duplicate `transform: none` rules.

## Users
- **Primary**: Game creators who have moved listings to the Recycle Bin and need to definitively purge storage artifacts without cognitive clutter or accidental misclicks.
- **Not for**: General catalog buyers or soft-deletion actions.

## Hypothesis
We believe **downsizing the `.countdown-pill` to a sleek micro-pill geometry (`min-width: 136px`, `padding: 3px 12px 6px 12px`, `font-size: 0.72rem`) and eliminating redundant boilerplate ("Are you sure you want to...") in favor of action-first titles and a single punchy consequence warning** will **produce a streamlined, distraction-free modal that maintains 100% safety while respecting Steam DesignMD craft standards**.
We'll know we're right when **the modal height is reduced by ~40px, the countdown pill looks visually balanced as a micro-badge, zero redundant question sentences remain, and all 27+ stress tests pass with zero regressions**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Countdown Pill Min-Width | 136px (down from 172px) | CSS bounding assertion in unit/integration tests |
| Countdown Pill Font Size | 0.72rem (down from 0.78rem) | CSS token assertion |
| Boilerplate Phrasing ("Are you sure...") | 0 occurrences in studio HTML | Template regex assertion |
| Destructive Consequence Clarity | Explicit game title in header/warning | Template audit |
| Full Quality Gate (`npm run verify`) | 100% GREEN (0 errors) | Automated test suite execution |

## Scope
**MVP**
1. **Compact Pill Styling**:
   - Reduce `.countdown-pill` dimensions in `creator-studio.component.css` (`min-width: 136px`, `padding: 3px 12px 6px 12px`, `font-size: 0.72rem`, `margin-bottom: 10px`).
   - Slim down `.countdown-progress-track` from `3px` to `2.5px`.
2. **Redundancy Elimination**:
   - Update header to be action-first: `Permanently Delete "{{ gameToPurge.title }}"?`.
   - Remove redundant `modal-lead-text` (`Are you sure you want to permanently erase...`).
   - Streamline `purge-warning-box` text to a clean, crisp callout: `All media, build files, and metadata will be wiped immediately. <strong>This action cannot be undone.</strong>`.
   - Remove duplicate `transform: none` declarations in CSS.
3. **Automated Stress & Integration Tests**:
   - Update `ui-ux-polish-stress.ts` and `integration-tests.spec.ts` to assert the compact pill tokens and absence of boilerplate copy.

**Out of scope**
- Changing the 5-second lock duration (5s is established as the repository standard).
- Altering the soft-delete Recycle Bin flow.

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Compact Countdown Pill | Downsized, sleek pill badge with 136px min-width | pending | `.claude/PRPs/plans/purge-modal-refinement.plan.md` |
| 2 | Redundancy Purge in Modal | Removed "Are you sure..." boilerplate; action-first title | pending | `.claude/PRPs/plans/purge-modal-refinement.plan.md` |
| 3 | Verification & Stress Suite | Full test suite green with updated invariants | pending | `.claude/PRPs/plans/purge-modal-refinement.plan.md` |

## Open Questions
- [x] Header title phrasing: `Permanently Delete "{{ gameToPurge.title }}"?` provides immediate clarity on exactly what is being destroyed without needing a separate paragraph.
- [x] Pill size: `min-width: 136px` accommodates `"Wait 5s to confirm"` and `"Ready to confirm"` without layout shift.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Text overflow in compact pill | Low | Low | Tested with fixed-width mono font and 136px boundary |
| Accidental test breakages on previous string matches | Low | Medium | Update test assertions to match compact tokens and new header |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

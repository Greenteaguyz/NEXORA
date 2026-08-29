# PRD: Seamless Footer & Auto-Save Draft on Leave

## Problem
In NEXORA Creator Studio ([`/studio/games/new`](http://localhost:4200/studio/games/new)), creators face two friction points:
1. **Intrusive Divider Line**: A rigid border line (`border-top: 1px solid var(--border-card)`) slices across the entire viewport directly above the action buttons (`Cancel`, `Save as Draft`, `Publish Game`), creating visual noise and disrupting the dark glassmorphism aesthetic.
2. **Work Loss on Route Exit**: When creators leave the "Add New Game" tab (e.g., clicking Cancel, navigating to Catalog, Library, or Profile), their uncommitted work risks being lost or interrupted by jarring blocking confirmation modals instead of seamlessly saving their progress as a private draft.

## Evidence
- User supplied screenshot explicitly isolating the rigid line above the action buttons with the directive: *"remove the line above the cancel , save as a draft , publish and auto save as draft when leave the the add new game tab /plan-prd"*.
- Codebase audit:
  - `src/app/features/creator-studio/game-form/game-form.component.css:955` hardcodes `border-top: 1px solid var(--border-card);`.
  - `src/app/features/creator-studio/game-form/unsaved-changes.guard.ts:21` triggers a native blocking `window.confirm()` rather than automatically capturing drafts.

## Users
- **Primary**: Indie Game Creators authoring game listings who require a seamless, distraction-free publishing UI and automatic protection against losing draft content.
- **Not for**: Public store buyers browsing games.

## Hypothesis
We believe that **removing the rigid top border from the sticky actions footer while automatically saving dirty form state as a private draft whenever the creator navigates away from the Add New Game tab** will **create a cleaner, modern dark UI and eliminate creator anxiety regarding lost work**. We will know we are right when **the action bar floats seamlessly without a dividing line, and leaving the page with work-in-progress immediately saves it to the creator's Drafts collection with instant toast feedback**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Divider Line Absence | 0px border-top | CSS audit confirming `border-top: none` on `.form-actions-footer` |
| Draft Auto-Save Rate | 100% dirty forms saved | Automatic creation of draft in `localStore` upon route exit |
| Pristine Form Cleanliness | 0 empty drafts created | Clean exit without draft creation when form has not been edited |
| Auto-Save User Feedback | 1 non-blocking toast | Notification `"Draft saved automatically"` upon navigation |
| Quality Gate | 100% GREEN | `npm run verify` (unit, integration, master battery, anti-slop) |

## Scope
**MVP**
1. **Seamless Footer Aesthetic**:
   - Remove `border-top: 1px solid var(--border-card);` from `.form-actions-footer.sticky`.
   - Preserve soft blurred backdrop (`backdrop-filter: blur(12px)`) and subtle ambient shadow (`box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.35)`) for legibility over scrolled content.
2. **Auto-Save as Draft on Route Exit**:
   - Update `unsaved-changes.guard.ts` and `GameFormComponent`:
     - If the form is dirty and has content (e.g. title or description/artwork), automatically invoke draft persistence before allowing route deactivation.
     - If title is blank but other fields are filled, assign an intuitive fallback title (e.g., `Untitled Draft (Aug 29)`).
     - Persist as `status: 'draft'` (isolated from public store catalog and search).
     - Display a non-blocking toast notification: `"Draft saved automatically"`.
   - Ensure pristine forms (zero user input) exit cleanly without creating empty dummy drafts.
3. **Browser Lifecycle Safety**:
   - Connect auto-save to component lifecycle (`ngOnDestroy` / `beforeunload`) to safeguard against accidental window closes or page refreshes.

**Out of scope**
- Auto-saving on keystroke every second (unnecessary storage writes; auto-save on page leave + explicit manual save button is optimal).
- Auto-publishing games (only drafts are auto-saved).

## Delivery Milestones
<!-- Status: pending | in-progress | complete -->

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | PRD & Requirements Definition | Establish scope, behavior, and edge cases | complete | `.claude/prds/auto-draft-and-seamless-footer.prd.md` |
| 2 | Implementation Plan | Map exact files, TDD tests, and guard changes | in-progress | `implementation_plan.md` |
| 3 | Remove Intrusive Footer Border | Update CSS to remove `border-top` divider | pending | — |
| 4 | Auto-Save on Leave Implementation | Upgrade guard and component to auto-persist drafts | pending | — |
| 5 | Quality Gate & Verification | Validate via `npm run test:integration` and `npm run verify` | pending | — |

## Open Questions
- None. User directives are clear: remove the line above Cancel/Save Draft/Publish, and auto-save as draft when leaving the tab.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Saving empty drafts if user visits and immediately leaves | Low | Medium | Guard strictly checks `hasUnsavedChanges()` and verifies at least one field has user content |
| Async navigation race condition | Low | Low | Auto-save draft writes synchronously to reactive `LocalStoreService` before navigation resolves |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

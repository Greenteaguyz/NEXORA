# UI/UX Polish, Modal Recovery, Draft Auto-Dismiss & Recycle Bin Readability

## Problem
Four key touchpoints across NEXORA exhibit severe UI/UX flaws, loading regressions, and contrast issues identified in testing:
1. **Header Log Out Modal Blowout**: When opening the Log Out modal, the `.check-icon` SVG expands to full-screen width due to missing modal CSS in `header.component.css`, covering the screen in a giant white checkmark.
2. **Change Password Modal Styling Disconnect**: The inputs in the Change Password modal use `.form-control`, which lacks base input styling tokens (`background`, `border`, `padding`, `border-radius`, and light theme tokens), appearing unstyled compared to the rest of the application.
3. **Persistent Draft Banner in Creator Studio**: The `"asdw" is now saved as a draft` banner stays permanently on screen between the metric cards and the tabs until the user manually clicks `✕`, cluttering the workspace and reappearing on page refreshes.
4. **Recycle Bin Text Readability & Contrast**: In the Creator Studio Recycle Bin tab, rows use `.unpublished-row { opacity: 0.75; }` which washes out all text (title, tags, price, date, badges, buttons), while `.status-pill.bin` and action buttons have low contrast against dark backgrounds.

## Evidence
- Screenshot 1: Full-screen checkmark SVG overlaying the unstyled Log Out dialog.
- Screenshot 2: Change Password modal displaying unstyled raw browser inputs and lingering ternary text.
- Screenshot 3: User highlighted draft banner in Creator Studio with instruction: *"for the draft msg i want it to auto remove long but not too long"*.
- Screenshot 4: Creator Studio Recycle Bin table view where text is murky and washed out. User feedback: *"also in the recycle section the text isn't as readiable as the other sections"*.

## Users
- **Primary**:
  - Creators saving drafts, editing games, and managing deleted titles in Creator Studio.
  - Users interacting with modals (signing out via Header or managing passwords in Profile).
- **Not for**: External third-party auth redirects.

## Hypothesis
We believe **adding standard Steam modal styles to Header (fixing the SVG blowout), applying consistent input tokens to `.form-control` in Profile, implementing a 5.5s auto-dismiss timer with hover pause on Creator Studio's draft banner, and restoring 100% text opacity with high-contrast badge/button tokens in the Recycle Bin** will **eliminate critical visual regressions, streamline modal interactions, and ensure crystal-clear readability across all views**.
We'll know we're right when **the logout modal renders with a clean 18px checkmark and centered backdrop, password inputs match Steam dark/light theme tokens, the draft banner automatically fades out after 5.5s without reappearing on refresh, and Recycle Bin rows have 100% sharp text with WCAG AAA-compliant contrast**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Checkmark SVG Dimension | Exactly 18x18px | CSS bounding box assertion in unit/integration tests |
| Log Out Modal Presentation | 100% styled | `.modal-backdrop`, `.modal-card`, and footer styled in Header CSS |
| Password Input Token Fidelity | 100% matching | `.form-control` styled with `var(--bg-elevated)` & `var(--border-card)` |
| Draft Banner Auto-Dismiss | 5,500ms | Timer auto-hides banner; hover pauses timer; URL query params cleaned |
| Recycle Bin Text Contrast | 100% opacity, AAA contrast | Text opacity is 1; high-contrast rose/emerald palette |
| Zero Raw Emojis / Dingbats | 0 occurrences | Anti-slop / Dingbats regex validation |

## Scope
**MVP**
1. Add full modal CSS to `header.component.css` (`.modal-backdrop`, `.modal-card`, `.safe-data-callout`, `.check-icon`, `.btn-cancel`, `.btn-confirm-logout`, and light theme overrides).
2. Fix `.form-control` in `profile.component.css` so password inputs inherit standard Steam styling.
3. Clean up modal footer submit button copy in `profile.component.html`.
4. Add 5,500ms auto-dismiss timer with hover pause (`mouseenter`/`mouseleave`) and router query parameter cleanup to `creator-studio.component.ts`.
5. Remove `opacity: 0.75` from `.unpublished-row` text in `creator-studio.component.css`; apply subtle desaturation to thumbnail only; upgrade `.status-pill.bin`, `.btn-action.restore`, and `.btn-action.purge-danger` with high-contrast text and light mode rules.
6. Replace raw `✕` with `&times;` in `creator-studio.component.html` and `header.component.html`.
7. Add integration tests verifying modal dimensions, timer behaviors, and high-contrast styling.

**Out of scope**
- Global redesign of other unrelated tabs.
- Backend schema changes.

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Header Modal & SVG Fix | Log Out modal fully styled; SVG constrained to 18px | pending | `.claude/PRPs/plans/ui-ux-polish-and-draft-auto-dismiss.plan.md` |
| 2 | Profile Modal Input Tokens | Password fields properly styled with Steam tokens | pending | `.claude/PRPs/plans/ui-ux-polish-and-draft-auto-dismiss.plan.md` |
| 3 | Creator Studio Draft Auto-Dismiss | 5.5s auto-dismiss, hover pause, URL query cleanup | pending | `.claude/PRPs/plans/ui-ux-polish-and-draft-auto-dismiss.plan.md` |
| 4 | Recycle Bin Readability & Contrast | 100% text opacity, high-contrast badges and actions | pending | `.claude/PRPs/plans/ui-ux-polish-and-draft-auto-dismiss.plan.md` |

## Open Questions
- [x] Auto-dismiss duration: 5,500ms ("long but not too long", comfortable reading pace).
- [x] Should mouse hover pause auto-dismiss? Yes.
- [x] Recycle Bin visual indicator: Desaturate thumbnail image only, leaving all text 100% crisp.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Auto-dismiss timer memory leak on navigate away | Medium | Low | Clear timeout in `ngOnDestroy` / `destroyRef` |
| Header modal CSS bleeding into other components | Low | Low | Scoped Angular component encapsulation |
| Recycle bin contrast in light theme | Medium | Low | Explicit `:host-context([data-theme="light"])` tokens |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

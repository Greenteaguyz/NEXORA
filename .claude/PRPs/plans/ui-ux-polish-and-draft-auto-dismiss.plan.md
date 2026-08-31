# Plan: UI/UX Polish, Modal Recovery, Draft Auto-Dismiss & Recycle Bin Readability

## Summary
Resolves critical visual and behavioral regressions across four touchpoints: fixes the unstyled Header Log Out modal (which caused an SVG checkmark blowout across the screen), standardizes input styling for the Change Password modal in Profile (`.form-control`), implements a 5.5s auto-dismiss timer with hover pause and URL query cleanup on Creator Studio's draft alert banner, and restores 100% text opacity with high-contrast badge/button tokens in the Recycle Bin table.

## User Story
- As a user logging out of NEXORA, I want a grounded, well-styled confirmation dialog with an appropriately sized checkmark icon, so that the modal feels desktop-grade and legible.
- As a user changing my password, I want the input fields to match the dark/light Steam design tokens with clear borders and padding, so that the dialog looks polished and intentional.
- As a creator saving a draft, I want the confirmation banner to automatically dismiss after ~5.5 seconds (or pause if I hover over it) without cluttering my workspace or resurrecting on page refresh.
- As a creator inspecting the Recycle Bin, I want all game titles, prices, dates, and action buttons to be crisp, readable, and high-contrast, so that soft-deleted listings are easy to review and manage.

## Problem → Solution
1. **Header Log Out Modal**:
   - *Problem*: Missing CSS in `header.component.css` makes the modal render unstyled and causes `.check-icon` to blow up across the screen.
   - *Solution*: Implement standard Steam DesignMD modal styles with fixed 18px SVG constraints, backdrop blur, centered card layout, and light theme tokens.
2. **Profile Password Inputs**:
   - *Problem*: `.form-control` lacks base input styling (`background`, `border`, `padding`, `border-radius`, and light theme tokens).
   - *Solution*: Group `.form-control` under the established `.form-input` CSS rules in `profile.component.css` and clean up the submit button label.
3. **Creator Studio Draft Alert**:
   - *Problem*: Stays indefinitely between metric cards and table until manually clicked; persists on refresh due to uncleared URL query parameters.
   * *Solution*: Introduce a 5,500ms auto-dismiss timer, hover pause/resume events, URL query cleanup (`replaceUrl`), smooth fade/collapse animation, and replace raw `✕` with `&times;`.
4. **Recycle Bin Readability**:
   - *Problem*: `.unpublished-row { opacity: 0.75; }` washes out all text in the row, while `.status-pill.bin` and action buttons have low contrast.
   - *Solution*: Remove `opacity: 0.75` from row text (leaving all typography at 100% opacity); apply subtle desaturation only to the game thumbnail (`filter: grayscale(35%); opacity: 0.88;`); upgrade `.status-pill.bin` and action buttons with high-contrast text (`#FDA4AF` / `#6EE7B7`) and complete light-theme overrides.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/prds/ui-ux-polish-and-draft-auto-dismiss.prd.md`
- **PRD Phase**: Milestones 1–4
- **Estimated Files**: 5 files

---

## UX Design

### Before
```
[Header Logout Modal]
┌────────────────────────────────────────────────────────┐
│                      \       /                         │
│                       \     /  <- GIANT CHECKMARK      │
│                        \   /      COVERING SCREEN      │
│                         \ /                            │
│  Log out of NEXORA?                                    │
│  [Unstyled text and buttons scattered across page]     │
└────────────────────────────────────────────────────────┘

[Creator Studio Banner]
┌────────────────────────────────────────────────────────┐
│  ✓ "asdw" is now saved as a draft.                  ✕  │
└────────────────────────────────────────────────────────┘
Stays forever until manual click. Reappears on F5 refresh.

[Recycle Bin Row]
┌────────────────────────────────────────────────────────┐
│ [Dimmed 0.75]  asd   $9.99   • In Recycle Bin [Murky]  │
└────────────────────────────────────────────────────────┘
```

### After
```
[Header Logout Modal]
┌────────────────────────────────────────────────────────┐
│ [Dark Backdrop Blur 8px]                               │
│        ┌──────────────────────────────────────┐        │
│        │ Log out of NEXORA?                ×  │        │
│        │ You will need to sign in again...    │        │
│        │ [✓ 18px] Your data stays saved...    │        │
│        │                [Cancel]  [Log Out]   │        │
│        └──────────────────────────────────────┘        │
└────────────────────────────────────────────────────────┘

[Creator Studio Banner]
┌────────────────────────────────────────────────────────┐
│  ✓ "asdw" is now saved as a draft.                  ×  │
└────────────────────────────────────────────────────────┘
Auto-dismisses smoothly after 5.5s ("long but not too long").
Pauses timer on mouse hover. Cleans URL query parameters.

[Recycle Bin Row]
┌────────────────────────────────────────────────────────┐
│ [Thumbnail Desaturated]  asd (100%)  $9.99  [Rose-300] │
│                          [Restore]  [Delete Perm]      │
└────────────────────────────────────────────────────────┘
All text is 100% opaque, crisp, and WCAG AAA compliant.
```

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `src/app/layout/header/header.component.html` | 445–471 | Logout modal markup and `.check-icon` element |
| P0 (critical) | `src/app/layout/header/header.component.css` | 1300–1342 | Target location for missing modal styles |
| P1 (important) | `src/app/features/creator-studio/creator-studio.component.ts` | 50–95 | Toast state and query param handling |
| P1 (important) | `src/app/features/creator-studio/creator-studio.component.html` | 46–65, 160–225 | Alert banner and Recycle Bin table markup |
| P1 (important) | `src/app/features/creator-studio/creator-studio.component.css` | 365–375, 460–470, 520–560 | `.unpublished-row`, `.status-pill.bin`, and action buttons |
| P1 (important) | `src/app/features/profile/profile.component.css` | 985–1010 | Base input tokens (`.form-input`) |

---

## Patterns to Mirror

### STEAM_MODAL_PATTERN
```css
/* SOURCE: src/app/features/profile/profile.component.css:741 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.modal-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-xl, 16px);
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}
```

### RECYCLE_BIN_CONTRAST_PATTERN
```css
/* SOURCE: src/app/features/creator-studio/creator-studio.component.css */
.unpublished-row .showcase-thumb {
  filter: grayscale(35%);
  opacity: 0.88;
}
.status-pill.bin {
  background: rgba(244, 63, 94, 0.14);
  color: #FDA4AF;
  border: 1px solid rgba(244, 63, 94, 0.35);
}
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/app/layout/header/header.component.css` | UPDATE | Add full modal CSS for logout dialog, constraining `.check-icon` to 18px |
| `src/app/layout/header/header.component.html` | UPDATE | Replace raw `✕` with `&times;` |
| `src/app/features/profile/profile.component.css` | UPDATE | Add `.form-control` to `.form-input` styling rules for Steam input fidelity |
| `src/app/features/profile/profile.component.html` | UPDATE | Remove lingering `(hasPassword() ? ...)` ternary from submit button |
| `src/app/features/creator-studio/creator-studio.component.ts` | UPDATE | Implement 5.5s auto-dismiss timer, hover pause/resume, and query param cleanup |
| `src/app/features/creator-studio/creator-studio.component.html` | UPDATE | Add hover event bindings and replace raw `✕` with `&times;` |
| `src/app/features/creator-studio/creator-studio.component.css` | UPDATE | Remove `opacity: 0.75` from row; style thumbnail only; upgrade contrast for bin status & actions |
| `tests/integration/integration-tests.spec.ts` | UPDATE | Add invariants for check-icon 18px constraint, modal CSS, timer, and high-contrast bin styling |

---

## Step-by-Step Tasks

### Task 1: Style Log Out Modal & Constrain Checkmark in Header
- **ACTION**: Add `.modal-backdrop`, `.modal-card`, `.modal-header`, `.modal-body`, `.modal-footer`, `.safe-data-callout`, `.check-icon`, `.btn-cancel`, and `.btn-confirm-logout` to `header.component.css`.
- **IMPLEMENT**: Constrain `.check-icon` to `width: 18px; height: 18px; min-width: 18px; min-height: 18px; flex-shrink: 0;`. Add light theme tokens. Replace raw `✕` with `&times;` in `header.component.html`.
- **MIRROR**: `STEAM_MODAL_PATTERN`.
- **VALIDATE**: Run integration tests.

### Task 2: Polish Password Inputs in Profile
- **ACTION**: Group `.form-control` with `.form-input` in `profile.component.css`.
- **IMPLEMENT**: Provide dark background `var(--bg-elevated)`, border `var(--border-card)`, radius `var(--radius-md)`, and light mode overrides. Update submit button text in `profile.component.html`.
- **VALIDATE**: Verify template compiles cleanly and inputs inherit Steam styling.

### Task 3: Implement 5.5s Auto-Dismiss for Creator Studio Banner
- **ACTION**: Update `creator-studio.component.ts` to manage a 5,500ms dismiss timer with hover pause and route param cleaning.
- **IMPLEMENT**:
  - `startPublishToastTimer()`: triggers `closePublishToast()` after 5,500ms.
  - `pausePublishToastTimer()` & `resumePublishToastTimer()`: pauses on hover, resumes on leave.
  - Clear timer in `ngOnDestroy` / `closePublishToast()`.
  - Clean URL parameters using `this.router.navigate([], { queryParams: {}, replaceUrl: true })`.
  - In `creator-studio.component.html`, bind `(mouseenter)` and `(mouseleave)` and use `&times;`.
- **VALIDATE**: Automated tests + verify in browser.

### Task 4: Upgrade Recycle Bin Readability & Contrast
- **ACTION**: Remove `opacity: 0.75` from `.unpublished-row` in `creator-studio.component.css`.
- **IMPLEMENT**:
  - Apply subtle desaturation to the game thumbnail only: `.unpublished-row .showcase-thumb { filter: grayscale(35%); opacity: 0.88; }`.
  - Upgrade `.status-pill.bin` text to `#FDA4AF` (rose-300) in dark mode, `#BE123C` in light mode.
  - Upgrade `.btn-action.restore` text to `#6EE7B7` (emerald-300), with solid `#10B981` on hover.
  - Upgrade `.btn-action.purge-danger` text to `#FDA4AF` (rose-300), with solid `#DC2626` on hover.
- **VALIDATE**: Verify text contrast and run tests.

### Task 5: Automated Testing & Verification
- **ACTION**: Add test cases to integration tests and run full quality gate `npm run verify`.
- **VALIDATE**: Build: 0 errors | 100% tests green.

---

## Testing Strategy

| Test | Input | Expected Output |
|---|---|---|
| Checkmark SVG Dimension | Inspect `header.component.css` | `.check-icon` specifies `18px` width & height |
| Header Modal Backdrop | Inspect `header.component.css` | `.modal-backdrop` and `.modal-card` defined with blur |
| Password Input Token | Inspect `profile.component.css` | `.form-control` grouped with `.form-input` |
| Draft Auto-Dismiss Timeout | Timer constant check | Constant is between 5000ms and 6000ms (5500ms) |
| URL Param Cleanup | Trigger toast | Router removes `draftSaved` query params |
| Recycle Bin Row Opacity | Inspect `creator-studio.component.css` | `.unpublished-row` does NOT apply `opacity: 0.75` to text |
| Recycle Bin Status Contrast | Inspect `.status-pill.bin` | Uses high-contrast `#FDA4AF` (dark) and `#BE123C` (light) |
| Zero Emojis / Dingbats | Regex scan | 0 occurrences across modified files |

---

## Validation Commands
```bash
# Integration Tests
npm run test:integration

# Unit Tests
npm run test:unit

# Full Quality Gate
npm run verify
```

---

## Acceptance Criteria
- [ ] Header log out modal renders cleanly centered with backdrop blur
- [ ] Checkmark SVG is constrained to 18px without expanding
- [ ] Profile password inputs use Steam theme background, borders, and radius
- [ ] Creator Studio draft message automatically dismisses after 5.5s
- [ ] Mouse hover pauses the auto-dismiss timer
- [ ] Refreshing after saving a draft does not resurrect the banner
- [ ] Recycle Bin table row text is 100% opaque, sharp, and high-contrast
- [ ] Zero raw emojis or Dingbats characters
- [ ] Full quality gate `npm run verify` passes with 0 failures

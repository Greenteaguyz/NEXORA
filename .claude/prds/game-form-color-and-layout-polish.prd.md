# Game Form Color Consistency & Layout Polish

## Problem
In the Game Editor view (`/studio/games/:id/edit` and `/studio/games/new`), several critical visual, theme, and layout regressions undermine the Steam DesignMD standard:
1. **Light Mode Blackout & Contrast Failure**: The sticky actions footer has hardcoded dark styling (`background: rgba(14, 20, 27, 0.92)`), rendering a pitch-black floating box on a white/silver canvas. The Cancel link inside it uses dark slate text (`#2D3748`), rendering it completely invisible against the black footer (failing WCAG contrast). Readiness badges with `#FACC15` are unreadable on light cards.
2. **Primary CTA Inconsistency**: The submit button (`Save Changes` / `Publish Game`) uses an ad-hoc blue gradient with undefined variables (`var(--accent-600) / var(--accent-700)`) instead of the standardized Steam Green gradient (`var(--steam-btn-gradient)`) established across NEXORA.
3. **Anti-Slop Neon Glow & Floating Hover**: The submit button has a forbidden blurry neon halo (`box-shadow: 0 0 16px rgba(...)`), the status pulse dot has neon glow (`box-shadow: 0 0 6px`), and the tag input has a floating scale animation (`transform: scale(1.05)`).
4. **Screenshots Grid 3+1 Layout Breakage**: The screenshots grid uses an auto-fit minmax rule that expands to 3 columns on standard viewports, leaving the 4th screenshot isolated and stretched on Row 2 instead of maintaining a clean, symmetrical 2x2 grid.
5. **Hero Cover Aspect Ratio Squish**: The cover frame has a competing `max-height` rule that overrides `aspect-ratio: 16 / 9`, distorting 16:9 widescreen uploads into a squished 2.5:1 panoramic rectangle.

## Evidence
- Code audit of [`game-form.component.css`](file:///c:/Users/User/Downloads/AngularProject/src/app/features/creator-studio/game-form/game-form.component.css): Only a single light theme override exists across 1,119 lines.
- Code audit of [`DESIGN.md`](file:///c:/Users/User/Downloads/AngularProject/DESIGN.md): Section 1 specifies Steam Green for Primary CTAs, Section 5 mandates symmetrical 2x2 thumbnail matrix, Section 8 bans neon blur glow.
- User feedback: *"in edit game listing there are some color inconsistentcy and layout as well analyze first"*.

## Users
- **Primary**: Creators publishing new games or editing existing listings in Creator Studio.
- **Not for**: Public store browsing or checkout.

## Hypothesis
We believe **adding comprehensive Light Mode tokens to the sticky footer and inspector cards, standardizing the submit button to Steam Green with grounded hover, enforcing a symmetrical 2x2 screenshots grid, and removing the aspect-ratio squish on the hero cover** will **deliver a consistent, accessible, and grounded editor interface that strictly complies with Steam DesignMD and WCAG AAA standards**.
We'll know we're right when **the light theme renders with high contrast and zero dark blackouts, the submit CTA matches Creator Studio's Steam Green standard, screenshot slots always form a balanced 2x2 matrix, cover art maintains 16:9 ratio, and 100% of test suites pass**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Light Mode Footer Contrast | >= 7:1 ratio (AAA) | WCAG color token validation |
| Submit Button Styling | Steam Green (`#75B022` / `#588A1B`) | CSS gradient token inspection |
| Anti-Slop Compliance | 0 neon halos, 0 floating transforms | Impeccable test suite assertion |
| Screenshots Grid Symmetry | Exactly 2x2 columns on desktop | CSS grid template assertion |
| Cover Aspect Ratio Fidelity | 16:9 contract preserved | CSS bounding box audit |
| Full Quality Gate (`npm run verify`) | 100% GREEN (0 errors) | Automated test suite execution |

## Scope
**MVP**
1. **Light Mode Polish**:
   - Add full `:host-context([data-theme="light"])` rules for `.form-actions-footer.sticky`, `.btn-cancel`, `.readiness-inspector-card`, `.readiness-badge`, `.readiness-progress-track`, `.readiness-item`, and `.preview-game-card`.
2. **Submit CTA & Anti-Slop**:
   - Standardize `.btn-submit` to `--steam-btn-gradient` (`#75B022` &rarr; `#588A1B`), remove blurry neon box-shadows.
   - Remove neon halo from `.status-pulse-dot.active`.
   - Remove floating hover (`transform: scale(1.05)`) in `tag-chip-input.component.css`.
3. **Layout Corrections**:
   - Change `.bento-screenshots-grid` to `grid-template-columns: repeat(2, 1fr);`.
   - Remove `max-height` clamp from `.bento-media-frame.hero-frame` to maintain pure 16:9.
   - Add top border to `.form-actions-footer.sticky` and increase form padding-bottom to `110px`.
   - Purge dead CSS selector `.bento-media-hub`.
4. **Stress & Integration Testing**:
   - Add Game Form verification suite to `ui-ux-polish-stress.ts` and `integration-tests.spec.ts`.

**Out of scope**
- Changing form validation logic or DTO payload fields.
- Re-architecting drag-and-drop upload mechanics.

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Light Mode & Theme Consistency | Seamless light theme; high-contrast footer and badges | pending | `.claude/PRPs/plans/game-form-polish.plan.md` |
| 2 | Steam Green CTA & Anti-Slop | Standardized Steam Green submit button, 0 neon blur | pending | `.claude/PRPs/plans/game-form-polish.plan.md` |
| 3 | Symmetrical Grid & 16:9 Geometry | Symmetrical 2x2 screenshots and true 16:9 cover frame | pending | `.claude/PRPs/plans/game-form-polish.plan.md` |
| 4 | Verification & Quality Gate | All stress and regression test suites passing 100% | pending | `.claude/PRPs/plans/game-form-polish.plan.md` |

## Open Questions
- [x] CTA gradient: Standardize to Steam Green (`var(--steam-btn-gradient, linear-gradient(90deg, #75B022 0%, #588A1B 100%))`).
- [x] Symmetrical grid breakpoint: 2 columns on desktop/tablet, collapsing to 1 column at `<= 540px`.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Test breakages on submit button gradient | Low | Low | Update existing integration tests to recognize Steam Green gradient |
| Content overlap with sticky footer | Low | Medium | Increase form padding-bottom to 110px |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

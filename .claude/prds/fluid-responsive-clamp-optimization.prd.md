# PRD: Fluid Clamp Optimization & Responsive Viewport Boundary Calibration

## Problem
On intermediate display viewports—specifically compact laptops (1077px) and tablet-landscape devices (901px)—the interface experiences layout clipping, text collisions, and awkward column compression:
1. **Header Nav Collision at 1077px**: When a creator with 6 navigation tabs (`Store`, `Genres`, `Library`, `Wishlist`, `Orders`, `Creator Studio`) views the storefront at 1077px, the navigation tabs directly collide with and overlap the `Search [Ctrl K]` input because the combined width exceeds 1,238px, while the mobile collapse breakpoint was set at 1024px.
2. **Game Detail Showcase Squishing at 901px**: In `Apex Legends` and other game detail views, the two-column showcase stage requires ~1,120px to display the 700px media player and 300px metadata capsule comfortably. Because the column collapse breakpoint was set to `max-width: 900px`, viewports between 901px and 1024px suffer severe squishing and cramped text.

## Evidence
- User supplied two responsive inspector screenshots:
  1. `Dimensions: Responsive 901 × 1061`: Two-column showcase squeezed into an 811px container.
  2. `Dimensions: Responsive 1077 × 1061`: `"Creator Studio"` overlaps `"Search [Ctrl K]"` in the header.
- Codebase audit:
  - `src/app/layout/header/header.component.css:1064`: Breakpoint hardcoded to `1024px` without an intermediate compression tier for search/user-chip between 1040px and 1240px.
  - `src/app/features/game-detail/game-detail.component.css:1061`: Breakpoint hardcoded to `900px`.

## Users
- **Primary**: Gamers and game creators accessing NEXORA on laptops, tablets (iPad Pro landscape, Surface Pro), or resized desktop browser windows (900px–1240px).
- **Not for**: Print styles or non-browser environments.

## Hypothesis
We believe that:
1. **Adding an intermediate header compression state (`@media (max-width: 1240px)`)**—converting the search bar to an icon-only button and hiding redundant role tags—combined with tuned fluid `clamp()` values, will **eliminate all header text collisions from 1041px to 1240px while keeping the full desktop navigation visible**.
2. **Raising the Game Detail showcase breakpoint from 900px to 1024px** will **ensure 901px viewports display an unconstrained, full-width 16:9 media gallery with clean metadata stacking**.
3. **Calibrating desktop nav collapse to 1040px** cleanly avoids dead zones.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Header Nav Collision | 0 collisions at all widths > 1040px | Exhaustive 1px-step mathematical sweep across 1000px–1920px |
| Game Detail Showcase CLS & Squish | 0 squished cards at 901px–1024px | 1-column stack verified for all widths $\le 1024px$ |
| Monotonic Clamps | 100% monotonic non-decreasing | Derivative / bounds verification over 320px–1920px |
| Quality Gate | 100% GREEN | `npm run verify` (unit, integration, master, impeccable) + stress suite |

## Scope
**MVP**
1. **Header Fluid Tuning & Intermediate Tier (`header.component.css`)**:
   - Tune base `clamp()` padding and gaps:
     - `.header-container`: `padding: 0 clamp(12px, 2.2vw, 40px);`
     - `.header-left`: `gap: clamp(10px, 1.2vw, 24px);`
     - `.nav-links`: `gap: clamp(2px, 0.4vw, 6px);`
     - `.nav-item a`: `font-size: clamp(0.76rem, 0.8vw, 0.84rem); padding: 5px clamp(5px, 0.55vw, 9px);`
     - `.header-actions`: `gap: clamp(6px, 0.8vw, 12px);`
   - Add `@media (max-width: 1240px)` intermediate tier:
     - `.btn-cmd-search .search-btn-label, .btn-cmd-search .search-btn-kbd`: `display: none;`
     - `.btn-cmd-search`: `width: 36px; height: 34px; padding: 0; min-width: 36px; justify-content: center;`
     - `.user-chip .role-tag`: `display: none;`
   - Remove dead label/kbd hide from 768px block ($\le 768 \subset \le 1240$).
   - Rename `@media (max-width: 1024px)` block $\rightarrow$ `1040px`.
2. **Game Detail Viewport Calibration (`game-detail.component.css`)**:
   - Update showcase breakpoint from `@media (max-width: 900px)` to `@media (max-width: 1024px)`.
   - Stacks 1fr / 16px, hides `.capsule-image-wrap`, compacts `.steam-capsule-card` and `.capsule-pitch`.
3. **Integration Audit (Suite 16 in `integration-tests.spec.ts`)**:
   - Verify 1240px tier, 1040px collapse (no residual 1024 nav-collapse), 1024px showcase stacking, container clamp max $\le 40px$.
4. **Deterministic Stress Suite (`tests/stress/responsive-boundary-stress.ts`)**:
   - Parse clamp functions and breakpoints from CSS.
   - Sweep 1000px–1920px at 1px steps to prove header width requirement $\le$ usable width for every width $> 1040px$.
   - Sweep 768px–1440px at 1px steps for game detail.

**Out of scope**
- Changes to templates or global CSS (`styles.css`).
- Commit creation (changes left in working tree for user review).

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | PRD & Scope Finalization | Formalized 1240px tier, 1040px breakpoint, and stress suite | complete | `.claude/prds/fluid-responsive-clamp-optimization.prd.md` |
| 2 | CSS Updates | Update `header.component.css` & `game-detail.component.css` | pending | — |
| 3 | Integration Audits | Implement Suite 16 in `integration-tests.spec.ts` | pending | — |
| 4 | Stress Harness | Implement `tests/stress/responsive-boundary-stress.ts` | pending | — |
| 5 | Execution & Quality Gate | Run stress harness + `npm run verify` | pending | — |
| 6 | Diff Review Pass & Report | Verify AC checklist and report worst-case margins | pending | — |

---
*Status: APPROVED — ready for direct execution.*

# Full-Repository Impeccable Craft & Anti-Slop Polish

## Problem
A comprehensive `/impeccable audit` across all 15 views identified several lingering craft discrepancies that violate the Steam DesignMD specification:
1. **Residual Raw Unicode Dingbats (`✕` / `✓`)**: 14 instances across 10 template files use raw characters in place of clean, accessible inline SVGs with `viewBox` and `aria-hidden="true"`, or `&times;` in modal close buttons.
2. **Residual Blurry Neon Glow Shadows**: 5 CSS files contain non-directional `box-shadow: 0 0 Xpx [color]` glow halos (e.g. in game-catalog filter chips, profile mode switch, account-payment verified badge, download-tray elevation, and header theme switch thumb).
3. **Repetitive Icon-Box Fluff**: `/genres` contains decorative 40px `.section-icon-box` elements placed beside `h2` headings, violating Anti-Slop Rule #3.
4. **Micro-Interaction & Alignment Inconsistencies**: Modal close buttons have varying dimensions (24px to 32px) and border radii instead of the standardized 28px squircle (`var(--radius-sm)`).

## Evidence
- Code audit across `src/app/` using regex search patterns `[\u2700-\u27BF]` and `box-shadow:[^;]*0\s+0\s+\d+px`.
- Audit findings documented in `walkthrough.md` and `tests/stress/ui-ux-polish-stress.ts`.
- `DESIGN.md` Anti-Slop Rules 1, 2, 3, and 6.

## Users
- All desktop gamers and creators browsing, discovering, purchasing, managing, and configuring games across the entire NEXORA platform.

## Hypothesis
We believe that **eliminating all raw Unicode Dingbats in favor of inline SVGs/&times;, removing all non-directional blurry neon box-shadows in favor of crisp 1px borders and directional ambient occlusion, stripping decorative icon boxes, and standardizing modal close squircles** will **bring the entire application to 100% Impeccable Craft compliance without visual noise or accessibility regressions**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Raw Unicode Dingbats in UI | Exactly 0 | Regex scan `[\u2700-\u27BF]` across all templates |
| Blurry Neon Glow Shadows | Exactly 0 | Regex scan `box-shadow: 0 0 Xpx` across all styles |
| Repetitive Section Icon Boxes | Exactly 0 | CSS and template audit |
| Full Quality Gate (`npm run verify`) | 100% GREEN (0 errors) | Automated test suite execution |
| UI/UX Stress Battery | 100% PASSING | `tests/stress/ui-ux-polish-stress.ts` |

## Scope
**MVP**
1. **Dingbats Elimination**:
   - `game-catalog.component.html`: lines 155, 175, 236.
   - `genres.component.html`: line 28.
   - `game-detail.component.html`: lines 175, 295, 349, 415, 436.
   - `library.component.html`: lines 28, 59, 162.
   - `wishlist.component.html`: lines 27, 58, 164.
   - `orders.component.html`: line 143.
   - `support.component.html`: line 51.
   - `toast.component.ts`: line 52.
   - `download-tray.component.ts`: lines 94, 155.
   - `tag-chip-input.component.html`: lines 13, 37, 64.
   - `creator-profile.component.html`: line 49.
   - `forgot-password.component.html`: line 11.
2. **Neon Blur Elimination**:
   - `game-catalog.component.css`: lines 232, 501, 506, 749, 1250.
   - `profile.component.css`: lines 514, 528, 532.
   - `account-payment.component.css`: line 229.
   - `header.component.css`: lines 833, 1244, 1250.
   - `download-tray.component.ts`: lines 177, 187.
3. **Quieter & Distilled Geometry**:
   - Remove `.section-icon-box` in `genres.component.html`.
   - Standardize modal close buttons to 28px squircles with `var(--radius-sm)`.
4. **Stress & Invariant Expansion**:
   - Expand `ui-ux-polish-stress.ts` to enforce zero dingbats across ALL templates and zero neon halos across ALL stylesheets.

**Out of scope**
- Route or functional state changes.
- Backend/mock data schema alterations.

# Plan: Steam Slate Precision Profile Iconography Optimization

**Source PRD**: Conversational Request (`http://localhost:4200/profile`)
**Selected Milestone**: Profile Icon System Refactoring (Option 1 — Steam Slate Precision)
**Complexity**: Low / Surgical Refactor

## Summary
Refactor the iconography across NEXORA's Profile page ([`/profile`](http://localhost:4200/profile)) to replace noisy, pastel "candy-box" containers and muddy semi-transparent fills with unified Steam Slate precision line art. Standardize optical stroke weights to 1.75px, eliminate redundant card navigation arrows, resolve the lime/blue color clash, and align the iconography with Steam DesignMD standards.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Icon Geometry | `DESIGN.md:68-74` | Standard radii: `var(--radius-sm, 4px)` for utility containers |
| Semantic Color | `DESIGN.md:12-16` | Slate surfaces (`#16202D`, `#2A475E`), Steam Cyan hover illumination |
| Anti-Slop Tokens | `impeccable-anti-slop.spec.ts` | Zero neon blur, zero wobbly fills, zero pill utility boxes |
| Integration Audits | `tests/integration/integration-tests.spec.ts:1270` | Flexible regex and file-structure invariant assertions |

## Files to Change
| File | Action | Why |
|---|---|---|
| `src/app/features/profile/profile.component.html` | UPDATE | Replace muddy fills with clean 1.75px line art, remove redundant `.stat-arrow` SVGs |
| `src/app/features/profile/profile.component.css` | UPDATE | Unify `.stat-icon-wrap` into Steam slate tiles, remove rainbow boxes and arrow styles |
| `tests/integration/integration-tests.spec.ts` | UPDATE | Add Suite 17: Profile Iconography & Slate Precision Invariants |

## Tasks

### Task 1: Refactor Stat Card Icons & Remove Redundant Arrows
- **Action**: In `profile.component.html`, update the 4 stat card icons:
  - Gamepad (Owned Games): Clean 1.75px stroke, un-filled geometry.
  - Heart (Wishlist): Crisp 1.75px stroke, un-filled geometry.
  - Orders (Purchases): Crisp 1.75px stroke receipt outline.
  - Wallet (Balance): Crisp 1.75px stroke wallet/card outline.
  - Remove all 4 instances of `<svg class="stat-arrow">`.
- **Validate**: Inspect HTML to ensure `stat-arrow` is gone and stroke-width is 1.75px.

### Task 2: Steam Slate Tile CSS System
- **Action**: In `profile.component.css`:
  - Replace rainbow background classes (`.lime`, `.rose`, `.cyan`, `.emerald`) with a unified Steam Slate tile:
    - `background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-card); border-radius: var(--radius-sm);`
    - Hover state: `color: var(--accent-400); border-color: rgba(102, 192, 244, 0.35); background: rgba(102, 192, 244, 0.08);`
  - Refine `.setting-icon-box` in Creator Studio row to match the clean slate tile aesthetic.
  - Purge dead `.stat-arrow` CSS rules.
- **Validate**: Check light and dark theme styling in CSS.

### Task 3: Hero & Meta Icon Optical Standardization
- **Action**: In `profile.component.html` and `profile.component.css`:
  - Standardize camera icon, email icon, and clock/join date icon to `stroke-width="1.75"`.
- **Validate**: Consistent visual hierarchy across all profile sections.

### Task 4: Automated Verification Suite
- **Action**: Add Suite 17 in `tests/integration/integration-tests.spec.ts`:
  - Assert zero instances of `.stat-arrow` in profile template and CSS.
  - Assert `.stat-icon` uses clean `fill="none"` and `stroke-width="1.75"`.
  - Assert `.stat-icon-wrap` uses unified slate styling without rainbow color-clash rules.
- **Validate**: `npm run verify` runs 100% green.

## Validation
```bash
npm run test:integration
npm run verify
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Card clickability affordance reduced by removing chevron arrows | Low | The entire stat card retains active hover states (border glow + subtle inset shadow) |
| Light mode contrast degradation | Low | Verified high-contrast dark text and slate borders in `:host-context([data-theme="light"])` |

## Acceptance
- [ ] All 4 stat card icons use pure 1.75px stroke line art with zero muddy fills
- [ ] Rainbow pastel icon boxes replaced with sleek Steam Slate tiles
- [ ] Color clash bug (`lime` bg + blue icon) permanently eliminated
- [ ] Redundant chevron arrows removed from stat cards
- [ ] Hero meta icons unified to 1.75px optical weight
- [ ] Suite 17 integration tests pass
- [ ] `npm run verify` passes with 100% green

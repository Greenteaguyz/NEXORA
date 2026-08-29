# Plan: Replace Total Catalog Value with Units Sold

**Selected Decision**: (Recommended) Keep Total Revenue & replace Catalog Value with 'Units Sold'
**Target**: `src/app/features/creator-studio/` & `tests/integration/integration-tests.spec.ts`
**Complexity**: Small

## Summary
Replaces the confusing vanity metric "Total Catalog Value" ($44.98) with "Units Sold" (1 Unit), perfectly complementing "Total Revenue" ($4.49, 90% Net) like Steamworks and itch.io commercial dashboards.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Metric Cards | `src/app/features/creator-studio/creator-studio.component.html:23` | `.metric-card` with `.metric-value` and `.metric-label` |
| Computed State | `src/app/features/creator-studio/creator-studio.component.ts:100` | Getter / signal derivation |

## Files to Change
| File | Action | Why |
|---|---|---|
| `src/app/features/creator-studio/creator-studio.component.ts` | UPDATE | Add `unitsSold` computation from confirmed orders |
| `src/app/features/creator-studio/creator-studio.component.html` | UPDATE | Replace Total Catalog Value card with Units Sold |
| `tests/integration/integration-tests.spec.ts` | UPDATE | Add assertion for Units Sold count in Section 12 |

## Tasks
### Task 1: Add Units Sold to Component & State
- In `CreatorStudioComponent`: track `unitsSold` signal / getter derived from confirmed customer orders.
- Alice Vance has 1 seed order (Bob bought Marvel Rivals `game_001`). `unitsSold` = 1.

### Task 2: Update Creator Studio HTML
- In `creator-studio.component.html`: Card 3 becomes:
  ```html
  <div class="metric-card">
    <span class="metric-value cyan">{{ unitsSold }}</span>
    <span class="metric-label">Units Sold</span>
  </div>
  ```

### Task 3: Integration Tests & Quality Gate
- Run `npm run test:integration`
- Run `npm run verify`

## Acceptance
- [ ] Card 3 displays `Units Sold` (e.g. `1`, Cyan)
- [ ] Card 4 displays `Total Revenue` (`$4.49`, Emerald with `90% Net` badge)
- [ ] Confusing double-dollar figures eliminated
- [ ] All 106+ integration tests pass GREEN
- [ ] `npm run verify` passes with zero errors

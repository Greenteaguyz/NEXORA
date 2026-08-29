# Plan: Creator Studio Lifecycle Suite (Recycle Bin, Drafts, Revenue, Undo & Stress Battery)

**Source PRD**: `.claude/prds/creator-studio-lifecycle-suite.prd.md`
**Selected Milestone**: Milestones 1–5 (Full Lifecycle Suite)
**Complexity**: Medium

## Summary
Implements an end-to-end publishing lifecycle and safety system in Creator Studio: a 4-card metric grid (Active, Drafts, Catalog Value, and 90% Net Total Revenue), a dedicated Recycle Bin tab with permanent deletion and batch purge, and triple-layer miss-click protection with an 8-second quick Undo toast. Includes a comprehensive 18-assertion stress test battery covering every conceivable failure mode.

---

## 18 Stress Failure Modes to Test & Fix

1. **Empty/Whitespace Draft Rejection**: Submitting a draft with empty or pure whitespace title must be rejected.
2. **Draft Public Isolation**: Draft games must **never** appear in public catalog listings (`getGames()`).
3. **Draft Search Isolation**: Search queries for draft titles must return 0 results for non-owners.
4. **Draft Multi-Owner Privacy**: Creator B (Bob) must not see Creator A's (Alice's) drafts when querying `getGamesByOwnerId('usr_bob')`.
5. **Draft to Active Promotion**: Transitioning a draft to published must immediately make it visible in the public catalog.
6. **Soft Delete Invariant**: Soft-deleting an active game moves it to the Recycle Bin and removes it from `/catalog`.
7. **Idempotent Soft Delete**: Calling `deleteGame()` multiple times on the same game must preserve the initial `deletedAt` timestamp without mutation.
8. **Invalid ID Soft Delete**: Soft-deleting a non-existent game ID must throw an error safely without corrupting the store.
9. **Recycle Bin Query Isolation**: `Active` and `Drafts` table tabs must never leak items that have `deletedAt`.
10. **Recycle Bin Tab Filtering**: The `bin` view tab must strictly contain only items where `deletedAt` is present.
11. **Recycle Bin Restore**: Restoring a game from the Recycle Bin clears `deletedAt` and returns it to Active/Draft.
12. **Idempotent Restore**: Restoring an already active game must be a safe no-op.
13. **Permanent Deletion Purge**: Permanently deleting a game must eradicate it from the database array and LocalStorage, leaving zero residual traces.
14. **Permanent Deletion of Non-Existent ID**: Purging an invalid ID must safely throw without corrupting other listings.
15. **Atomic Empty Recycle Bin**: Emptying the Recycle Bin must delete all archived games for the calling owner in one atomic transaction.
16. **Empty Bin Multi-Tenant Isolation**: Alice emptying her Recycle Bin must **never** touch or delete Bob's or Carol's games.
17. **Rapid 50-Cycle Delete & Undo Stress**: 50 rapid sequential soft-delete and undo operations must maintain 100% data integrity without duplication.
18. **Total Revenue 90% Net Calculation**: Confirmed customer orders on games owned by the creator calculate exact 90% net revenue ($0 for free games, 0 for missing orders, never `NaN`).

---

## Patterns to Mirror

| Category | Source | Pattern |
|---|---|---|
| Modals | `src/app/shared/ui/game-card/game-card.component.html:71` | `.modal-backdrop` with `appScrollLock`, focus trap, escape key listener, grounded buttons |
| Toasts & Actions | `src/app/core/services/toast.service.ts:11` | `ToastService.show({ type: 'info', action: { label: 'Undo', run: () => ... } }, 8000)` |
| Grounded Hover | `AGENTS.md` | `transform: none; translateY: 0px`, snappy `0.15s ease` transitions |
| Data Layer | `src/app/core/data/games/mock-games-data.service.ts:185` | In-memory array manipulation with atomic `this.persist()` to LocalStorage |

---

## Files to Change

| File | Action | Why |
|---|---|---|
| `tests/integration/integration-tests.spec.ts` | UPDATE | Add Section 12 with 18 stress test assertions (RED first) |
| `src/app/core/models/game.model.ts` | UPDATE | Add `status?: 'draft' | 'published' | 'archived'` to `Game` and DTOs |
| `src/app/core/data/games/mock-games-data.service.ts` | UPDATE | Filter drafts from public catalog, add `permanentlyDeleteGame` and `emptyRecycleBin` |
| `src/app/core/data/orders/mock-orders-data.service.ts` | UPDATE | Add `getAllOrders()` for creator revenue derivation |
| `src/app/features/creator-studio/creator-studio.component.ts` | UPDATE | Add 4 metrics (Active, Drafts, Value, Total Revenue), view tabs, reminder modals, and Undo function |
| `src/app/features/creator-studio/creator-studio.component.html` | UPDATE | Render 4 metric cards, view tab strip, confirmation modals, and bin management |
| `src/app/features/creator-studio/creator-studio.component.css` | UPDATE | Style 4 cards, tabs, modal backdrops, and amber/emerald accents |
| `src/app/features/creator-studio/game-form/game-form.component.ts` | UPDATE | Add `saveAsDraft()` logic and title validation |
| `src/app/features/creator-studio/game-form/game-form.component.html` | UPDATE | Add `[Save as Draft]` button in sticky footer |

---

## Tasks

### Task 1: Write Section 12 Stress Test Battery (RED Phase)
- Implement all 18 stress failure assertions in `tests/integration/integration-tests.spec.ts`.
- Run `npm run test:integration` to verify compile/runtime RED failure.

### Task 2: Core Data Layer Enhancements (GREEN Phase)
- Update `Game` model with `status?: 'draft' | 'published' | 'archived'`.
- Implement `permanentlyDeleteGame` and `emptyRecycleBin` in `MockGamesDataService`.
- Expose `getAllOrders` in `MockOrdersDataService`.
- Run `npm run test:integration` to verify GREEN state.

### Task 3: Creator Studio Component & State
- Add `activeTab = signal<'all' | 'active' | 'drafts' | 'bin'>('all')`.
- Compute `activeGamesCount`, `draftGamesCount`, `binGamesCount`, `catalogValue`, and `totalRevenue` (90% net).
- Wire `openDeleteModal()`, `confirmMoveToBin()`, `undoDelete()`, `openPurgeModal()`, `confirmPurge()`, and `emptyBin()`.

### Task 4: Template & Impeccable CSS Overhaul
- Render 4 metric cards (`Active`, `Drafts`, `Catalog Value`, `Total Revenue`).
- Render tab strip (`All`, `Active`, `Drafts`, `Recycle Bin`).
- Render Move-to-Bin modal and Permanent-Delete modal.
- Render Recycle Bin table actions (`Restore` and `Permanently Delete`).

### Task 5: Publishing Form "Save as Draft" Button
- Wire `[Save as Draft]` in `GameFormComponent` sticky footer.
- Verify that incomplete games can be saved as private drafts.

### Task 6: Full Quality Gate & Visual QA
- Run `npm run verify` (build + unit + integration + master + anti-slop).
- Verify on live browser and capture walkthrough screenshot.

---

## Validation Commands

```bash
# Verify RED and GREEN state
npm run test:integration

# Full NEXORA Quality Gate
npm run verify
```

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Undo action executed after toast dismiss | Low | `ToastComponent` already implements a `graceMs` and `ranActions` deduplication guard. |
| Negative or non-numeric revenue calculation | Low | Strict `isFree` guard and `Math.max(0, ...)` rounding in revenue helper. |
| Deleting another creator's games | Low | Strict `g.ownerId === ownerId` filter enforced at the service layer and tested in stress suite. |

---

## Acceptance
- [ ] All 18 stress failure mode tests written and passing GREEN
- [ ] 4-Card Metrics Grid renders cleanly (Active, Drafts, Catalog Value, Total Revenue)
- [ ] Recycle Bin tab cleanly isolates deleted games from main workspace
- [ ] Move to Recycle Bin triggers confirmation reminder modal
- [ ] Deleting a draft triggers 8-second toast with working `[Undo]` button
- [ ] Permanent delete and empty bin completely purge records from LocalStorage
- [ ] Full quality gate `npm run verify` passes with zero errors

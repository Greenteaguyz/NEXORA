# Implementation Plan: Creator Studio Recycle Bin, Status Tabs, Confirmation Modal & Draft Undo

**Feature**: Creator Studio Recycle Bin, Status Tabs, Confirmation Reminder Modal & Miss-Click Undo Function
**Target**: `src/app/features/creator-studio/` & `src/app/core/services/toast.service.ts`
**Complexity**: Medium

---

## 1. Executive Summary
This feature establishes a desktop-grade, two-stage deletion lifecycle with **Triple-Layer Miss-Click Protection** in NEXORA's Creator Studio ([`/studio`](http://localhost:4200/studio)):
1. **Layer 1: Confirmation Reminder Modal**: Clicking delete on a draft or active listing triggers a confirmation modal matching the Catalog Wishlist removal modal design.
2. **Layer 2: Instant "Undo" Toast Notification**: Upon deleting a draft, an 8-second toast alert appears at the bottom of the screen with an interactive `[Undo]` action button that immediately restores the draft.
3. **Layer 3: Recycle Bin Tab**: Deleted items remain safely restorable in the dedicated **Recycle Bin** tab until explicitly purged with a permanent delete confirmation.

---

## 2. Patterns Grounded in Codebase

| Category | Source File | Existing Pattern |
|---|---|---|
| **Reminder Modal** | `src/app/shared/ui/game-card/game-card.component.html:71` | `.modal-backdrop` with `appScrollLock`, `#cardRemoveModalTitle`, lead text, `.btn-cancel`, and `.btn-confirm-delete` |
| **Grounded Buttons** | `AGENTS.md` | Zero subpixel shift (`transform: none; translateY: 0px`), snappy `0.15s ease` hover transitions |
| **Icons & Anti-Slop** | `AGENTS.md` | Zero raw emojis (`🗑️`), inline SVG icons with `viewBox="0 0 24 24"` and `aria-hidden="true"` |
| **Reactive Store** | `src/app/core/data/games/mock-games-data.service.ts` | Optimistic update, LocalStorage persistence, query cache invalidation |

---

## 3. Architecture & Technical Design

### A. Frontend Architecture (Creator Studio)
- **4-Card Metrics Grid**:
  1. **Active Games** (Green) — count of live store listings
  2. **Drafts** (Amber `#FACC15`) — count of work-in-progress listings
  3. **Total Catalog Value** (Cyan `#66C0F4`) — combined value of active games
  4. **Total Revenue** (Emerald `#A4D007` with `90% Net` badge) — real-time sales earnings from confirmed customer orders

- **Status Filter Tabs (Above Table)**:
  ```html
  <div class="studio-view-tabs" role="tablist" aria-label="Game listing filters">
    <button type="button" class="btn-tab" [class.active]="activeTab() === 'all'" (click)="setTab('all')">
      All ({{ allCount() }})
    </button>
    <button type="button" class="btn-tab" [class.active]="activeTab() === 'active'" (click)="setTab('active')">
      <span class="dot green"></span> Active ({{ activeCount() }})
    </button>
    <button type="button" class="btn-tab" [class.active]="activeTab() === 'drafts'" (click)="setTab('drafts')">
      <span class="dot amber"></span> Drafts ({{ draftsCount() }})
    </button>
    <button type="button" class="btn-tab tab-bin" [class.active]="activeTab() === 'bin'" (click)="setTab('bin')">
      <svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
      Recycle Bin ({{ binCount() }})
    </button>
  </div>
  ```

- **Confirmation Reminder Modal (Move to Recycle Bin)**:
  - Header: *"Move to Recycle Bin?"*
  - Body: *"Are you sure you want to move **'[Game Title]'** to the Recycle Bin? This will delist the game from the public store. You can restore it at any time from your Recycle Bin tab."*
  - Actions: `[Cancel]` and `[Move to Recycle Bin]` (danger styled with grounded hover).

- **Permanent Deletion Modal (Stage 2)**:
  - Header: *"Permanently Delete Game?"*
  - Body: *"Are you sure you want to permanently erase **'[Game Title]'**? All metadata and screenshots will be permanently wiped. This action cannot be undone."*
  - Actions: `[Cancel]` and `[Permanently Delete]`.

### B. Backend / Data Layer (`MockGamesDataService`)
- `deleteGame(id: string)`: Soft-deletes by stamping `deletedAt: ISOString`. Game is considered inside the Recycle Bin.
- `restoreGame(id: string)`: Clears `deletedAt`, returning the game to Active.
- `permanentlyDeleteGame(id: string)`: Splices the game completely from the `games` array and writes to `LocalStoreService`.
- `emptyRecycleBin(ownerId: string)`: Filters out all games where `ownerId === id && !!deletedAt` in one atomic operation.

---

## 4. Step-by-Step Implementation Tasks

### Task 1: Integration Stress Tests (TDD RED)
- File: `tests/integration/integration-tests.spec.ts`
- Add Section 12 & 13 covering:
  - `deleteGame` moves game to Recycle Bin.
  - Recycle Bin listings are excluded from public catalog queries.
  - `restoreGame` successfully restores game from Recycle Bin to Active.
  - `permanentlyDeleteGame` wipes game from LocalStorage completely.
  - `emptyRecycleBin` clears all deleted listings for the owner.
- Validate: `npm run test:integration` (fails RED).

### Task 2: Data Layer Extension
- File: `src/app/core/data/games/mock-games-data.service.ts`
- Implement `permanentlyDeleteGame(id: string)` and `emptyRecycleBin(ownerId: string)`.
- Validate: `npm run test:integration` (passes GREEN).

### Task 3: Creator Studio Component Logic & Tabs
- File: `src/app/features/creator-studio/creator-studio.component.ts`
- Add `activeTab = signal<'all' | 'active' | 'drafts' | 'bin'>('all')`.
- Add signals: `activeGames`, `draftGames`, `binGames`, `filteredGames`.
- Add modal state for Recycle Bin Move (`gameToBin`) and Permanent Delete (`gameToPurge`).

### Task 4: Template & Modal Design (Matching Catalog Style)
- File: `src/app/features/creator-studio/creator-studio.component.html`
- Update metric card 2 to **`Drafts`** (Amber).
- Add view tab strip.
- Render table rows conditioned on active tab.
- Insert the **Move to Recycle Bin Confirmation Modal** with `appScrollLock` and escape listener.
- Insert the **Permanent Deletion Modal**.

### Task 5: CSS Styling & Impeccable Design Compliance
- File: `src/app/features/creator-studio/creator-studio.component.css`
- Style tab pills with 0px grounded hover.
- Style modal backdrop with `rgba(14, 20, 27, 0.85)` and `backdrop-filter: blur(8px)`.
- Style amber `.dot.amber` and rose `.dot.rose`.

### Task 6: Full Quality Gate Verification
- Run `npm run verify` (build + integration + master + anti-slop).
- Verify with live browser session on `http://localhost:4200/studio`.

---

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Unpublishing hides game from existing buyers | High | Preserved `deletedAt` architecture: existing buyers still retain access in `LibraryComponent` (verified by commerce integration tests). |
| Accidental permanent deletion | High | Two-stage confirmation: soft delete first, explicit red modal before hard delete. |
| Modal trapping focus or breaking scroll | Medium | Uses tested `appScrollLock` directive with `PLATFORM_ID` browser guard. |

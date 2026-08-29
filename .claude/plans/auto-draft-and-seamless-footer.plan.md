# Plan: Seamless Footer & Auto-Save Draft on Leave

**Source PRD**: `.claude/prds/auto-draft-and-seamless-footer.prd.md`
**Complexity**: Low–Medium
**Target Area**: [`src/app/features/creator-studio/game-form/`](file:///c:/Users/User/Downloads/AngularProject/src/app/features/creator-studio/game-form/)

---

## Tasks

### Task 1: Remove Dividing Line Above Footer Actions
- In `src/app/features/creator-studio/game-form/game-form.component.css`:
  - Locate `.form-actions-footer.sticky`.
  - Remove `border-top: 1px solid var(--border-card);`.
  - Ensure background `rgba(14, 20, 27, 0.92)` with `backdrop-filter: blur(12px)` and soft ambient shadow `box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.35)` seamlessly floats over content without an intrusive divider line.

### Task 2: Implement Auto-Save on Leave in `GameFormComponentLike` & Guard
- In `src/app/features/creator-studio/game-form/unsaved-changes.guard.ts`:
  - Update `GameFormComponentLike` interface to include:
    ```typescript
    export interface GameFormComponentLike {
      hasUnsavedChanges: () => boolean;
      autoSaveDraftOnLeave?: () => boolean;
    }
    ```
  - In `unsavedChangesGuard`:
    ```typescript
    export const unsavedChangesGuard: CanDeactivateFn<GameFormComponentLike> = (component) => {
      if (typeof window === 'undefined') {
        return true;
      }
      if (component.hasUnsavedChanges()) {
        if (component.autoSaveDraftOnLeave) {
          return component.autoSaveDraftOnLeave();
        }
        return window.confirm('You have unsaved changes. Leave this page?');
      }
      return true;
    };
    ```

### Task 3: Implement Auto-Save Logic in `GameFormComponent`
- In `src/app/features/creator-studio/game-form/game-form.component.ts`:
  - Add `autoSaveDraftOnLeave(): boolean`:
    - Checks `hasUnsavedChanges()`.
    - If form has meaningful input (title or any dirty field):
      - Provides fallback title if needed: `formVal.title?.trim() || `Draft (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})``.
      - Constructs DTO with `status: 'draft'`.
      - Persists via `gamesData.createGame(...)` or `gamesData.updateGame(...)`.
      - Sets `justSaved = true;`.
      - Shows toast:
        ```typescript
        this.toast.show({
          type: 'info',
          title: 'Draft Saved',
          message: 'Your progress was automatically saved to Drafts.'
        });
        ```
      - Returns `true` to allow seamless navigation without blocking the user.
    - If form is completely empty/pristine:
      - Returns `true` without saving an empty dummy draft.
  - Add `@HostListener('window:beforeunload')` for browser tab close/refresh auto-persistence.

### Task 4: Integration Tests & Quality Gate
- In `tests/integration/integration-tests.spec.ts`:
  - Add Section 14 testing auto-save on leave invariants.
  - Verify dirty form saves draft to db.
  - Verify pristine form does not create empty draft.
  - Run `npm run test:integration`.
  - Run `npm run verify` to confirm 100% green pass.

---

## Acceptance Criteria
- [ ] The line above `Cancel`, `Save as Draft`, and `Publish Game` is completely removed.
- [ ] Navigating away from `/studio/games/new` automatically saves any work-in-progress as a private draft.
- [ ] Navigating away from a fresh, pristine form does not create empty drafts.
- [ ] A non-blocking toast informs the creator: `"Draft Saved: Your progress was automatically saved to Drafts."`
- [ ] Full quality gate `npm run verify` passes with 0 failures.

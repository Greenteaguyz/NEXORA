import { CanDeactivateFn } from '@angular/router';

/**
 * Minimal contract the guard depends on, so it stays decoupled from
 * the concrete GameFormComponent class.
 */
export interface GameFormComponentLike {
  hasUnsavedChanges: () => boolean;
  autoSaveDraftOnLeave?: () => boolean;
}

/**
 * Handles route deactivation when the game form holds unsaved edits.
 * Automatically saves the in-progress draft to prevent work loss without
 * blocking dialogs, falling back to confirm dialog if auto-save is unavailable.
 * Never blocks on the server (SSR safe).
 */
export const unsavedChangesGuard: CanDeactivateFn<GameFormComponentLike> = (component) => {
  if (typeof window === 'undefined') {
    return true; // SSR safety: no blocking dialogs outside the browser
  }
  if (component.hasUnsavedChanges()) {
    if (typeof component.autoSaveDraftOnLeave === 'function') {
      return component.autoSaveDraftOnLeave();
    }
    return window.confirm('You have unsaved changes. Leave this page?');
  }
  return true;
};

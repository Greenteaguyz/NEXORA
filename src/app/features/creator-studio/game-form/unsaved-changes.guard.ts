import { CanDeactivateFn } from '@angular/router';

/**
 * Minimal contract the guard depends on, so it stays decoupled from
 * the concrete GameFormComponent class.
 */
export interface GameFormComponentLike {
  hasUnsavedChanges: () => boolean;
}

/**
 * Blocks route deactivation when the game form holds unsaved edits.
 * Confirms with the user via a native confirm dialog; never blocks
 * on the server (no window) or when the form is pristine/saved.
 */
export const unsavedChangesGuard: CanDeactivateFn<GameFormComponentLike> = (component) => {
  if (typeof window === 'undefined') {
    return true; // SSR safety: no blocking dialogs outside the browser
  }
  return component.hasUnsavedChanges()
    ? window.confirm('You have unsaved changes. Leave this page?')
    : true;
};

/**
 * Pure animation logic for the header: desktop nav indicator geometry,
 * drawer stagger timing, and the drawer close/unmount scheduler.
 * Zero Angular imports — unit tests (tests/unit) consume this directly.
 */

/** Enter runs slower than exit with an ease-in-out S-curve so the panel
 *  glides out of the edge and settles — never teleports, never crawls. */
export const DRAWER_ENTER_MS = 400;
/** Must match the .mobile-drawer (closed-state) transition duration in header.component.css. */
export const DRAWER_EXIT_MS = 240;
/** Grace period past the CSS exit duration before the fallback unmount fires. */
export const UNMOUNT_FALLBACK_MS = 100;
export const STAGGER_STEP_MS = 35;
export const STAGGER_CAP_MS = 260;

export function staggerDelay(index: number, step = STAGGER_STEP_MS, cap = STAGGER_CAP_MS): number {
  return Math.min(index * step, cap);
}

export interface IndicatorGeometry {
  x: number;
  width: number;
}

/**
 * Resolve the active tab's horizontal geometry inside the nav row.
 * Returns null when the nav row is hidden (containerWidth <= 0) or no tab is active.
 */
export function computeIndicatorGeometry(
  containerWidth: number,
  tabs: Array<{ left: number; width: number } | null>
): IndicatorGeometry | null {
  if (containerWidth <= 0) return null;
  const active = tabs.find(tab => tab !== null);
  if (!active) return null;
  return { x: active.left, width: active.width };
}

export interface DrawerTimer {
  setTimeout(handler: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const globalTimers: DrawerTimer = {
  setTimeout: (handler, ms) => globalThis.setTimeout(handler, ms),
  clearTimeout: handle => globalThis.clearTimeout(handle as number)
};

/**
 * Owns the "drawer finished exiting → unmount" decision.
 * A generation counter invalidates every pending callback the moment the
 * drawer is re-opened or destroyed, so a rapid close→open can never unmount
 * an open drawer. The real unmount trigger is the drawer's `transitionend`;
 * the timer is only a fallback for missed transition events.
 */
export class DrawerCloseScheduler {
  private generation = 0;
  private timer: unknown = null;
  private pendingUnmount: (() => void) | null = null;

  constructor(private readonly timers: DrawerTimer = globalTimers) {}

  /** Call on open (and destroy): supersedes any pending unmount. */
  cancelPendingUnmount(): void {
    this.generation++;
    if (this.timer !== null) {
      this.timers.clearTimeout(this.timer);
      this.timer = null;
    }
    this.pendingUnmount = null;
  }

  /** Call on close: schedules the unmount no later than the fallback window. */
  scheduleUnmount(onUnmount: () => void): void {
    this.cancelPendingUnmount();
    const gen = this.generation;
    this.pendingUnmount = onUnmount;
    this.timer = this.timers.setTimeout(() => {
      if (gen !== this.generation) return;
      this.timer = null;
      this.pendingUnmount = null;
      onUnmount();
    }, DRAWER_EXIT_MS + UNMOUNT_FALLBACK_MS);
  }

  /**
   * Call from the drawer's transitionend (propertyName === 'transform') while
   * closed. Unmounts immediately and clears the fallback timer. Returns
   * whether an exit was actually in progress.
   */
  completeIfExiting(): boolean {
    if (this.pendingUnmount === null) return false;
    const callback = this.pendingUnmount;
    this.cancelPendingUnmount();
    callback();
    return true;
  }

  destroy(): void {
    this.cancelPendingUnmount();
  }
}

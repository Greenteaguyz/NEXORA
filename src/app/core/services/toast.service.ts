import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'download' | 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
  timestamp: number;
  /** True while the toast plays its exit transition before removal. */
  leaving?: boolean;
  /** Optional inline action (e.g. Undo). Clicking it runs the callback and dismisses the toast. */
  action?: { label: string; run: () => void };
}

/** How long a leaving toast stays on screen for its exit transition (ms). */
const EXIT_MS = 180;

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);

  /** Default auto-hide duration (ms) per toast severity. */
  readonly defaultDurations: Record<ToastMessage['type'], number> = {
    download: 4000,
    success: 3500,
    info: 4000,
    warning: 5000,
    error: 7000
  };

  /** Live timer handles keyed by toast id. */
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  /** Absolute dismissal deadlines (ms epoch) for live timers, keyed by toast id. */
  private deadlines = new Map<string, number>();
  /** Remaining milliseconds for paused toasts, keyed by toast id. */
  private pausedRemaining = new Map<string, number>();
  /** Maximum number of simultaneously visible (non-leaving) toasts. */
  private readonly maxVisible = 3;

  show(toast: Omit<ToastMessage, 'id' | 'timestamp'>, durationMs?: number): void {
    const duration = durationMs ?? this.defaultDurations[toast.type];

    // Dedupe: an identical visible toast just gets its timer reset.
    const duplicate = this.toasts().find(t =>
      !t.leaving && t.type === toast.type && t.title === toast.title && t.message === toast.message);
    if (duplicate) {
      this.clearTimer(duplicate.id);
      this.pausedRemaining.delete(duplicate.id);
      this.armTimer(duplicate.id, duration);
      return;
    }

    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: Date.now()
    };

    this.toasts.update(list => {
      const updated = [...list, newToast];
      // Cap the stack: the oldest active toasts start their exit immediately.
      const active = updated.filter(t => !t.leaving);
      const overflow = active.length - this.maxVisible;
      if (overflow > 0) {
        const evicted = active.slice(0, overflow);
        evicted.forEach(t => this.clearTimer(t.id));
        const evictedIds = new Set(evicted.map(t => t.id));
        this.scheduleRemovalFor(evictedIds);
        return updated.map(t => evictedIds.has(t.id) ? { ...t, leaving: true } : t);
      }
      return updated;
    });

    this.armTimer(id, duration);
  }

  pause(id: string): void {
    const handle = this.timers.get(id);
    if (handle === undefined) return;

    clearTimeout(handle);
    this.timers.delete(id);
    const remaining = Math.max(0, this.deadlines.get(id)! - Date.now());
    this.pausedRemaining.set(id, remaining);
    this.deadlines.delete(id);
  }

  resume(id: string): void {
    const remaining = this.pausedRemaining.get(id);
    if (remaining === undefined) return;

    this.pausedRemaining.delete(id);
    this.armTimer(id, remaining);
  }

  dismiss(id: string): void {
    const toast = this.toasts().find(t => t.id === id);
    if (!toast || toast.leaving) return;

    this.clearTimer(id);
    this.toasts.update(list => list.map(t => t.id === id ? { ...t, leaving: true } : t));
    this.scheduleRemovalFor(new Set([id]));
  }

  private scheduleRemovalFor(ids: Set<string>): void {
    setTimeout(() => {
      this.toasts.update(list => list.filter(t => !ids.has(t.id)));
      ids.forEach(id => {
        this.timers.delete(id);
        this.deadlines.delete(id);
        this.pausedRemaining.delete(id);
      });
    }, EXIT_MS);
  }

  private clearTimer(id: string): void {
    const handle = this.timers.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.timers.delete(id);
    }
    this.deadlines.delete(id);
  }

  private armTimer(id: string, durationMs: number): void {
    this.clearTimer(id);
    this.deadlines.set(id, Date.now() + durationMs);
    const handle = setTimeout(() => {
      this.timers.delete(id);
      this.deadlines.delete(id);
      this.dismiss(id);
    }, durationMs);
    this.timers.set(id, handle);
  }
}

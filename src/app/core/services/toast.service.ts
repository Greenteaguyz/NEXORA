import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'download' | 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
  timestamp: number;
  /** Optional inline action (e.g. Undo). Clicking it runs the callback and dismisses the toast. */
  action?: { label: string; run: () => void };
}

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

  show(toast: Omit<ToastMessage, 'id' | 'timestamp'>, durationMs?: number): void {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: Date.now()
    };

    this.toasts.update(list => [...list, newToast]);

    const duration = durationMs ?? this.defaultDurations[toast.type];
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
    const handle = this.timers.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.timers.delete(id);
    }
    this.deadlines.delete(id);
    this.pausedRemaining.delete(id);
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private armTimer(id: string, durationMs: number): void {
    this.deadlines.set(id, Date.now() + durationMs);
    const handle = setTimeout(() => {
      this.timers.delete(id);
      this.deadlines.delete(id);
      this.dismiss(id);
    }, durationMs);
    this.timers.set(id, handle);
  }
}

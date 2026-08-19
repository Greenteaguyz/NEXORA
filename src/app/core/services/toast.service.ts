import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'download' | 'success' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);

  show(toast: Omit<ToastMessage, 'id' | 'timestamp'>, durationMs: number = 4000): void {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: Date.now()
    };

    this.toasts.update(list => [...list, newToast]);

    setTimeout(() => {
      this.dismiss(id);
    }, durationMs);
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="status" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast-card toast-{{ toast.type }}"
          [class.toast-leaving]="toast.leaving"
          (mouseenter)="toastService.pause(toast.id)"
          (mouseleave)="toastService.resume(toast.id)"
          (focusin)="toastService.pause(toast.id)"
          (focusout)="toastService.resume(toast.id)"
        >
          <div class="toast-icon-wrap" aria-hidden="true">
            @if (toast.type === 'download') {
              <svg class="toast-svg download" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            } @else if (toast.type === 'success') {
              <svg class="toast-svg success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            } @else if (toast.type === 'error') {
              <svg class="toast-svg error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            } @else if (toast.type === 'warning') {
              <svg class="toast-svg warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            } @else {
              <svg class="toast-svg info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            }
          </div>
          <div class="toast-body">
            <h4 class="toast-title">{{ toast.title }}</h4>
            <p class="toast-message">{{ toast.message }}</p>
          </div>
          @if (toast.action) {
            <button
              type="button"
              class="btn-toast-action"
              (click)="runAction(toast)"
            >
              {{ toast.action.label }}
            </button>
          }
          <button
            type="button"
            class="btn-toast-close"
            (click)="requestDismiss(toast)"
            aria-label="Close notification"
          >
            <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: var(--z-toast, 100000);
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: 390px;
      width: calc(100% - 48px);
    }

    .toast-card {
      pointer-events: auto;
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: var(--bg-surface, #1B2838);
      border: 1px solid var(--border-card, #2A475E);
      border-radius: var(--radius-lg, 8px);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
      color: var(--text-primary, #F8FAFC);
      animation: slideInUp 0.2s ease-out;
      transition: transform 0.18s ease, opacity 0.18s ease;
    }

    .toast-card:hover .btn-toast-close,
    .toast-card:focus-within .btn-toast-close {
      opacity: 0.85;
    }

    .toast-leaving {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
      pointer-events: none;
    }

    :host-context([data-theme="light"]) .toast-card {
      background: var(--bg-surface, #FFFFFF);
      border-color: var(--border-card, #D2DBE3);
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
      color: var(--text-primary, #0F172A);
    }

    .toast-icon-wrap {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      margin-top: 2px;
    }

    .toast-svg {
      width: 18px;
      height: 18px;
    }

    .toast-svg.download { color: var(--cyan-400, #66C0F4); }
    .toast-svg.success  { color: var(--emerald-400, #A4D007); }
    .toast-svg.error    { color: var(--rose-500, #F43F5E); }
    .toast-svg.warning  { color: var(--amber-400, #E5A93C); }
    .toast-svg.info     { color: var(--accent-400, #66C0F4); }

    .toast-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .toast-title {
      font-size: 0.90rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary);
      line-height: 1.35;
    }

    .toast-message {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.45;
      margin: 0;
      word-break: break-word;
    }

    /* Action Button — shadcn/ui outline button aesthetic */
    .btn-toast-action {
      background: transparent;
      border: 1px solid var(--border-card, #2A475E);
      color: var(--text-primary, #F8FAFC);
      border-radius: var(--radius, 6px);
      padding: 5px 11px;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      flex-shrink: 0;
      align-self: center;
    }

    .btn-toast-action:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--accent-400);
      color: var(--accent-400);
    }

    :host-context([data-theme="light"]) .btn-toast-action:hover {
      background: rgba(0, 120, 212, 0.06);
      border-color: var(--accent-600);
      color: var(--accent-600);
    }

    /* Close Button — subtle & quiet by default, revealed on hover/focus */
    .btn-toast-close {
      background: none;
      border: none;
      color: var(--text-muted);
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      border-radius: var(--radius-sm, 4px);
      opacity: 0;
      transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
      flex-shrink: 0;
      margin: -2px -4px 0 0;
    }

    .btn-toast-close .close-icon {
      width: 15px;
      height: 15px;
    }

    .btn-toast-close:hover {
      opacity: 1;
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.08);
    }

    .btn-toast-close:focus-visible {
      opacity: 1;
      outline: 2px solid var(--accent-400);
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(14px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);

  private ranActions = new Set<string>();
  private readonly graceMs = 250;

  runAction(toast: ToastMessage): void {
    if (!toast.action || this.ranActions.has(toast.id)) return;
    if (Date.now() - toast.timestamp < this.graceMs) return;
    this.ranActions.add(toast.id);
    toast.action.run();
    this.dismiss(toast.id);
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  /** Grace-aware close: ignores taps in the first 250ms after spawn (ghost/double-tap guard). */
  requestDismiss(toast: ToastMessage): void {
    if (Date.now() - toast.timestamp < this.graceMs) return;
    this.toastService.dismiss(toast.id);
  }
}

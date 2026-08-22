import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="status" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-card toast-{{ toast.type }}" (click)="dismiss(toast.id)">
          <div class="toast-icon-wrap">
            @if (toast.type === 'download') {
              <svg class="toast-svg download" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            } @else if (toast.type === 'success') {
              <svg class="toast-svg success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            } @else if (toast.type === 'error') {
              <svg class="toast-svg error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            } @else {
              <svg class="toast-svg info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
          <button type="button" class="btn-toast-close" (click)="dismiss(toast.id)" aria-label="Close notification">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
      max-width: 380px;
      width: calc(100% - 48px);
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: rgba(19, 22, 34, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-card);
      border-radius: var(--radius-lg);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.75);
      color: var(--text-primary);
      cursor: pointer;
      animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    :host-context([data-theme="light"]) .toast-card {
      background: rgba(255, 255, 255, 0.98);
      border-color: var(--border-card);
      box-shadow: 0 16px 36px rgba(15, 23, 42, 0.15);
      color: var(--text-primary);
    }

    .toast-card:hover {
      transform: translateY(-2px);
    }

    .toast-icon-wrap {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }

    .toast-svg {
      width: 20px;
      height: 20px;
    }

    .toast-svg.download {
      color: var(--cyan-400);
    }

    .toast-svg.success {
      color: var(--emerald-400);
    }

    .toast-svg.error {
      color: var(--rose-500);
    }

    .toast-svg.info {
      color: var(--accent-400);
    }

    .toast-body {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-size: 0.92rem;
      font-weight: 800;
      margin: 0 0 2px;
      color: var(--text-primary);
    }

    .toast-message {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.4;
      margin: 0;
      word-break: break-word;
    }

    .btn-toast-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 0.9rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      opacity: 0.7;
      transition: opacity 0.15s ease;
    }

    .btn-toast-close:hover {
      opacity: 1;
      color: var(--text-primary);
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}

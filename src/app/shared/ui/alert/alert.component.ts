import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  Directive,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertVariant = 'default' | 'destructive' | 'warning' | 'info' | 'success';

@Directive({
  selector: 'app-alert-title, [alert-title], [appAlertTitle]',
  standalone: true,
  host: { 'class': 'alert-title' }
})
export class AlertTitleDirective {}

@Directive({
  selector: 'app-alert-description, [alert-description], [appAlertDescription]',
  standalone: true,
  host: { 'class': 'alert-description' }
})
export class AlertDescriptionDirective {}

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, AlertTitleDirective, AlertDescriptionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="steam-alert alert-{{ variant() }}"
      [attr.role]="role()"
      [attr.aria-live]="ariaLive()"
    >
      <div class="alert-icon-wrap" aria-hidden="true">
        @switch (variant()) {
          @case ('destructive') {
            <svg class="alert-svg destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          }
          @case ('warning') {
            <svg class="alert-svg warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
          @case ('success') {
            <svg class="alert-svg success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          }
          @case ('info') {
            <svg class="alert-svg info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          }
          @default {
            <svg class="alert-svg default" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          }
        }
      </div>
      <div class="alert-content">
        <ng-content></ng-content>
      </div>
      @if (dismissible()) {
        <button
          type="button"
          class="alert-close-btn"
          (click)="dismissed.emit()"
          aria-label="Dismiss alert"
        >
          &times;
        </button>
      }
    </div>
  `,
  styles: [`
    .steam-alert {
      position: relative;
      width: 100%;
      border-radius: var(--radius-lg, 8px);
      border: 1px solid var(--border-card, #2A475E);
      padding: 14px 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background-color: var(--bg-surface, #1B2838);
      color: var(--text-primary, #F8FAFC);
      transition: background-color 0.2s ease, border-color 0.2s ease;
      animation: alertSettle 0.15s ease-out;
    }

    .alert-icon-wrap {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }

    .alert-svg {
      width: 18px;
      height: 18px;
    }

    .alert-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .alert-title {
      font-weight: 700;
      font-size: 0.92rem;
      letter-spacing: -0.01em;
      line-height: 1.4;
      color: var(--text-primary);
      margin: 0;
    }

    .alert-description {
      font-size: 0.84rem;
      line-height: 1.5;
      color: var(--text-secondary);
      margin: 0;
    }

    .alert-close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.25rem;
      line-height: 1;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      border-radius: var(--radius-sm, 4px);
      transition: color 0.15s ease, background 0.15s ease;
      flex-shrink: 0;
      margin: -4px -4px 0 0;
    }

    .alert-close-btn:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.06);
    }

    /* Variant: Default */
    .alert-default {
      border-color: var(--border-card, #2A475E);
      background-color: var(--bg-surface, #1B2838);
    }
    .alert-default .alert-svg { color: var(--accent-400, #66C0F4); }

    /* Variant: Destructive */
    .alert-destructive {
      border-color: rgba(244, 63, 94, 0.4);
      background-color: rgba(244, 63, 94, 0.08);
    }
    .alert-destructive .alert-svg { color: var(--rose-500, #F43F5E); }
    .alert-destructive .alert-title { color: #FFA4B2; }

    /* Variant: Warning */
    .alert-warning {
      border-color: rgba(229, 169, 60, 0.4);
      background-color: rgba(229, 169, 60, 0.08);
    }
    .alert-warning .alert-svg { color: var(--amber-400, #E5A93C); }
    .alert-warning .alert-title { color: #FFE082; }

    /* Variant: Success */
    .alert-success {
      border-color: rgba(164, 208, 7, 0.4);
      background-color: rgba(164, 208, 7, 0.08);
    }
    .alert-success .alert-svg { color: var(--emerald-400, #A4D007); }
    .alert-success .alert-title { color: #D4F462; }

    /* Variant: Info */
    .alert-info {
      border-color: rgba(102, 192, 244, 0.4);
      background-color: rgba(102, 192, 244, 0.08);
    }
    .alert-info .alert-svg { color: var(--cyan-400, #66C0F4); }
    .alert-info .alert-title { color: #AEE2FF; }

    /* Light Theme Contrast Overrides */
    :host-context([data-theme="light"]) .alert-default {
      background-color: var(--bg-surface, #FFFFFF);
      border-color: var(--border-card, #D2DBE3);
    }
    :host-context([data-theme="light"]) .alert-destructive {
      border-color: rgba(225, 29, 72, 0.35);
      background-color: #FFF1F2;
    }
    :host-context([data-theme="light"]) .alert-destructive .alert-title { color: #9F1239; }
    :host-context([data-theme="light"]) .alert-warning {
      border-color: rgba(217, 119, 6, 0.35);
      background-color: #FFFBEB;
    }
    :host-context([data-theme="light"]) .alert-warning .alert-title { color: #92400E; }
    :host-context([data-theme="light"]) .alert-success {
      border-color: rgba(67, 160, 71, 0.35);
      background-color: #F0FDF4;
    }
    :host-context([data-theme="light"]) .alert-success .alert-title { color: #166534; }
    :host-context([data-theme="light"]) .alert-info {
      border-color: rgba(0, 120, 212, 0.35);
      background-color: #F0F9FF;
    }
    :host-context([data-theme="light"]) .alert-info .alert-title { color: #075985; }

    @keyframes alertSettle {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AlertComponent {
  variant = input<AlertVariant>('default');
  dismissible = input<boolean>(false);
  dismissed = output<void>();

  role = computed(() => (this.variant() === 'destructive' ? 'alert' : 'status'));
  ariaLive = computed(() => (this.variant() === 'destructive' ? 'assertive' : 'polite'));
}

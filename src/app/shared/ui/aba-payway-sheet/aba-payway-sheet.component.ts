import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, input, OnChanges, OnDestroy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KhqrCardComponent } from '../khqr-card/khqr-card.component';
import { PaymentBrandMarkComponent } from '../payment-brand-mark/payment-brand-mark.component';
import { convertCurrency, formatMoney } from '../../../core/data/payments/payment-finance-logic';
import { USD_TO_KHR_RATE } from '../../../core/data/payments/payment-logic';

export type PaywaySheetStatus = 'waiting' | 'processing' | 'succeeded' | 'expired';

const COUNTDOWN_START_SECONDS = 5 * 60;
const POLL_DURATION_MS = 3000;

/**
 * ABA PayWay checkout sheet — merchant-style payment panel that carries
 * KHQR under the hood. The amount is AUTO-SET from the game price: the USD
 * total plus its KHR equivalent at the snapshot rate. No manual amount
 * entry exists anywhere in this flow.
 *
 * Simulated lifecycle: waiting (QR shown, 5-minute expiry countdown) ->
 * processing (3s poll) -> succeeded. Expired sheets can be regenerated;
 * the payer can cancel any time before success.
 */
@Component({
  selector: 'app-aba-payway-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, KhqrCardComponent, PaymentBrandMarkComponent],
  templateUrl: './aba-payway-sheet.component.html',
  styleUrl: './aba-payway-sheet.component.css'
})
export class AbaPaywaySheetComponent implements OnChanges, OnDestroy {
  /** Auto-set charge in USD (major units) — derived from the game price by the host. */
  readonly amountUsd = input.required<number>();
  readonly merchantName = input('Nexora Co., Ltd');
  readonly orderRef = input('');
  /** Account identity sync: when provided, the QR card is the SAME card as the
   *  account-payment page's full KHQR card (same holder, same pattern). */
  readonly accountHolder = input<string | null>(null);
  readonly accountSeed = input<string | null>(null);

  readonly completed = output<void>();
  readonly cancel = output<void>();

  readonly status = signal<PaywaySheetStatus>('waiting');
  readonly countdownSeconds = signal(COUNTDOWN_START_SECONDS);

  readonly amountMinor = signal(0);
  readonly khrMinor = signal(0);

  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimers());
  }

  ngOnChanges(): void {
    // Auto-set pricing: the charge derives strictly from the game price.
    const usdMinor = Math.round(this.amountUsd() * 100);
    this.amountMinor.set(usdMinor);
    this.khrMinor.set(convertCurrency(usdMinor, 'USD', 'KHR', USD_TO_KHR_RATE));
    this.regenerate();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.countdownTimer !== null) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.pollTimer !== null) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  get rateLabel(): string {
    return `1 USD = \u17DB${USD_TO_KHR_RATE.toLocaleString('en-US')}`;
  }

  get usdLabel(): string {
    return formatMoney({ amountMinor: this.amountMinor(), currency: 'USD' });
  }

  get khrLabel(): string {
    return formatMoney({ amountMinor: this.khrMinor(), currency: 'KHR' });
  }

  get qrSeed(): string {
    return `aba-payway-${this.merchantName()}-${this.amountMinor()}-${this.orderRef()}`;
  }

  /** Falls back to the transaction seed when no account identity is supplied. */
  get cardHolderName(): string {
    return this.accountHolder() ?? this.merchantName();
  }

  get cardSeed(): string {
    return this.accountSeed() ?? this.qrSeed;
  }

  confirmPayment(): void {
    if (this.status() !== 'waiting') return;
    this.status.set('processing');
    this.pollTimer = setTimeout(() => {
      this.status.set('succeeded');
      this.clearCountdown();
      // Brief settle beat so the success state is perceivable before the
      // modal closes the purchase.
      this.pollTimer = setTimeout(() => this.completed.emit(), 900);
    }, POLL_DURATION_MS);
  }

  regenerate(): void {
    this.clearTimers();
    this.status.set('waiting');
    this.countdownSeconds.set(COUNTDOWN_START_SECONDS);
    this.countdownTimer = setInterval(() => {
      const next = this.countdownSeconds() - 1;
      this.countdownSeconds.set(next);
      if (next <= 0) {
        this.status.set('expired');
        this.clearCountdown();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownTimer !== null) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  emitCancel(): void {
    this.clearTimers();
    this.cancel.emit();
  }

  formatClock(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}

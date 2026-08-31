import { Component, Input, Output, EventEmitter, HostListener, OnInit, ElementRef, ViewChild, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game } from '../../../core/models/game.model';
import { AuthService } from '../../../core/auth/auth.service';
import { PAYMENTS_DATA } from '../../../core/data/tokens';
import { PaymentMethod, Wallet } from '../../../core/models/payment.model';
import { PaymentBrandMarkComponent } from '../payment-brand-mark/payment-brand-mark.component';
import { ScrollLockDirective } from '../../directives/scroll-lock.directive';
import { AddPaymentMethodFormComponent } from '../add-payment-method-form/add-payment-method-form.component';
import { AbaPaywaySheetComponent } from '../aba-payway-sheet/aba-payway-sheet.component';
import { formatUsd } from '../../../core/data/payments/payment-logic';

export interface PurchaseConfirmationEvent {
  paymentMethod: string;
}

/**
 * Modal dialog for confirming game purchases. Tenders: NEXORA Wallet, saved
 * methods, and the ABA PayWay rail (KHQR sheet with the amount auto-set from
 * the game price). New card/KHQR methods can be added inline via the shared
 * AddPaymentMethodFormComponent without leaving checkout.
 */
@Component({
  selector: 'app-purchase-confirm-modal',
  standalone: true,
  imports: [CommonModule, RouterLink, PaymentBrandMarkComponent, ScrollLockDirective, AddPaymentMethodFormComponent, AbaPaywaySheetComponent],
  templateUrl: './purchase-confirm-modal.component.html',
  styleUrls: ['./purchase-confirm-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseConfirmModalComponent implements OnInit {
  @Input({ required: true }) game!: Game;
  @Input() processing = false;
  @Input() loading = false;

  get isBusy(): boolean {
    return this.processing || this.loading;
  }

  @Output() confirm = new EventEmitter<PurchaseConfirmationEvent>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('confirmBtn') confirmBtn?: ElementRef<HTMLButtonElement>;

  private readonly auth = inject(AuthService);
  private readonly paymentsData = inject(PAYMENTS_DATA);
  private previouslyFocused: HTMLElement | null = null;

  // Saved Payment Methods and Wallet
  readonly savedMethods = signal<PaymentMethod[]>([]);
  readonly wallet = signal<Wallet | null>(null);
  readonly selectedOptionId = signal<string>(''); // 'wallet' | 'payway' | method.id

  readonly walletBalance = computed(() => this.wallet()?.balance ?? 0);
  readonly hasEnoughWallet = computed(() => this.walletBalance() >= (this.game?.price ?? 0));
  /**
   * Checkout tender rows: cards only. KHQR paying happens exclusively through
   * the ABA PayWay rail (single QR = safe transaction); saved KHQR methods
   * remain visible and manageable on the account-payment page.
   */
  readonly checkoutMethods = computed(() => this.savedMethods().filter(m => m.type === 'card'));

  /** Same identity the account-payment KHQR card shows — the two cards are one card. */
  readonly paywayHolder = computed(() => this.auth.currentUser()?.displayName ?? 'NEXORA Player');
  readonly paywaySeed = computed(() => this.savedMethods().find(m => m.type === 'khqr')?.id ?? 'nexora-demo');

  // Inline Add Payment Method (shared form)
  readonly showAddMethod = signal(false);

  // ABA PayWay rail
  readonly showPayway = signal(false);

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      this.previouslyFocused = document.activeElement as HTMLElement | null;
    }
    setTimeout(() => {
      this.confirmBtn?.nativeElement.focus();
    }, 50);

    const user = this.auth.currentUser();
    if (user) {
      this.paymentsData.getMethods(user.id).subscribe(methods => {
        this.savedMethods.set(methods);
        const def = methods.find(m => m.isDefault);
        if (def && !this.selectedOptionId()) {
          this.selectedOptionId.set(def.id);
        } else if (methods.length > 0 && !this.selectedOptionId()) {
          this.selectedOptionId.set(methods[0].id);
        }
      });

      this.paymentsData.getWalletSnapshot(user.id).subscribe(snap => {
        this.wallet.set(snap.wallet);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.previouslyFocused && typeof this.previouslyFocused.focus === 'function' &&
        typeof document !== 'undefined' && document.contains(this.previouslyFocused)) {
      this.previouslyFocused.focus();
    }
  }

  selectOption(id: string): void {
    this.selectedOptionId.set(id);
    if (id === 'payway') {
      this.openPayway();
    }
  }

  get formattedPaymentMethod(): string {
    const selected = this.selectedOptionId();
    if (selected === 'wallet') {
      return `NEXORA Store Wallet (${formatUsd(this.walletBalance())})`;
    }
    if (selected === 'payway') {
      return 'ABA PayWay (KHQR)';
    }

    const method = this.savedMethods().find(m => m.id === selected);
    if (method) {
      if (method.type === 'card') {
        return `Credit Card (${method.brand === 'visa' ? 'Visa' : 'Mastercard'} •••• ${method.last4})`;
      }
      return `${method.bank} KHQR (${method.handle})`;
    }

    return 'Credit Card (Visa •••• 4242)';
  }

  onConfirm(): void {
    if (this.isBusy) return;
    // The PayWay rail pays inside its own sheet — open it instead of emitting.
    if (this.selectedOptionId() === 'payway' && !this.showPayway()) {
      this.openPayway();
      return;
    }
    this.confirm.emit({ paymentMethod: this.formattedPaymentMethod });
  }

  onCancel(): void {
    if (this.isBusy) return;
    this.cancel.emit();
  }

  /* --- Inline Add Payment Method (shared form) --- */

  openAddMethod(): void {
    this.showAddMethod.set(true);
  }

  closeAddMethod(): void {
    this.showAddMethod.set(false);
    setTimeout(() => {
      this.confirmBtn?.nativeElement.focus();
    }, 50);
  }

  onMethodAdded(method: PaymentMethod): void {
    this.savedMethods.update(list => [...list, method]);
    this.selectedOptionId.set(method.id);
    this.closeAddMethod();
  }

  /* --- ABA PayWay rail --- */

  openPayway(): void {
    this.showPayway.set(true);
  }

  closePayway(): void {
    this.showPayway.set(false);
    if (this.selectedOptionId() === 'payway' && this.savedMethods().length > 0) {
      const fallback = this.savedMethods().find(m => m.isDefault) ?? this.savedMethods()[0];
      this.selectedOptionId.set(fallback.id);
    }
    setTimeout(() => {
      this.confirmBtn?.nativeElement.focus();
    }, 50);
  }

  onPaywayCompleted(): void {
    this.showPayway.set(false);
    this.confirm.emit({ paymentMethod: this.formattedPaymentMethod });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.showPayway()) {
        event.stopPropagation();
        this.closePayway();
        return;
      }
      if (this.showAddMethod()) {
        event.stopPropagation();
        this.closeAddMethod();
        return;
      }
      this.onCancel();
    }
  }

  formatUsd(amt: number): string {
    return formatUsd(amt);
  }
}

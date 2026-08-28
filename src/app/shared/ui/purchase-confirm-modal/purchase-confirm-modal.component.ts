import { Component, Input, Output, EventEmitter, HostListener, OnInit, ElementRef, ViewChild, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game } from '../../../core/models/game.model';
import { AuthService } from '../../../core/auth/auth.service';
import { PAYMENTS_DATA } from '../../../core/data/tokens';
import { PaymentMethod, Wallet } from '../../../core/models/payment.model';
import { PaymentBrandMarkComponent } from '../payment-brand-mark/payment-brand-mark.component';
import { formatUsd } from '../../../core/data/payments/payment-logic';

export interface PurchaseConfirmationEvent {
  paymentMethod: string;
}

/**
 * Modal dialog for confirming game purchases with saved payment methods and NEXORA Wallet tender.
 */
@Component({
  selector: 'app-purchase-confirm-modal',
  standalone: true,
  imports: [CommonModule, RouterLink, PaymentBrandMarkComponent],
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

  // Saved Payment Methods and Wallet
  readonly savedMethods = signal<PaymentMethod[]>([]);
  readonly wallet = signal<Wallet | null>(null);
  readonly selectedOptionId = signal<string>(''); // 'wallet' or method.id

  readonly walletBalance = computed(() => this.wallet()?.balance ?? 0);
  readonly hasEnoughWallet = computed(() => this.walletBalance() >= (this.game?.price ?? 0));

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
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
    document.body.style.overflow = '';
  }

  selectOption(id: string): void {
    this.selectedOptionId.set(id);
  }

  get formattedPaymentMethod(): string {
    const selected = this.selectedOptionId();
    if (selected === 'wallet') {
      return `NEXORA Store Wallet (${formatUsd(this.walletBalance())})`;
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
    this.confirm.emit({ paymentMethod: this.formattedPaymentMethod });
  }

  onCancel(): void {
    if (this.isBusy) return;
    this.cancel.emit();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }

  formatUsd(amt: number): string {
    return formatUsd(amt);
  }
}

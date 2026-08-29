import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PAYMENTS_DATA } from '../../core/data/tokens';
import { AddCardMethodDto, AddKhqrMethodDto, PaymentMethod, Wallet, WalletTransaction } from '../../core/models/payment.model';
import { approxKhr, detectCardBrand, formatUsd, validateCardInput } from '../../core/data/payments/payment-logic';
import { PaymentBrandMarkComponent } from '../../shared/ui/payment-brand-mark/payment-brand-mark.component';
import { KhqrCardComponent } from '../../shared/ui/khqr-card/khqr-card.component';
import { ScrollLockDirective } from '../../shared/directives/scroll-lock.directive';
import { ExpiryDateDirective } from '../../shared/directives/expiry-date.directive';

@Component({
  selector: 'app-account-payment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PaymentBrandMarkComponent,
    KhqrCardComponent,
    ScrollLockDirective,
    ExpiryDateDirective
  ],
  templateUrl: './account-payment.component.html',
  styleUrl: './account-payment.component.css'
})
export class AccountPaymentComponent {
  readonly auth = inject(AuthService);
  private readonly paymentsData = inject(PAYMENTS_DATA);

  // State Signals
  readonly methods = signal<PaymentMethod[]>([]);
  readonly wallet = signal<Wallet | null>(null);
  readonly transactions = signal<WalletTransaction[]>([]);
  readonly loading = signal<boolean>(true);

  // Status Alerts
  readonly alertSuccess = signal<string | null>(null);
  readonly alertError = signal<string | null>(null);

  // Modals state
  readonly showAddModal = signal<boolean>(false);
  readonly addMethodType = signal<'card' | 'khqr'>('card');
  readonly methodToRemove = signal<PaymentMethod | null>(null);
  readonly showTopUpModal = signal<boolean>(false);

  // Add Card form
  cardHolder = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardFormErrors = signal<string[]>([]);

  // Add KHQR form
  khqrBank: 'ABA' | 'ACLEDA' | 'Wing' = 'ABA';
  khqrHandle = '';
  khqrLinking = signal<boolean>(false);
  khqrFormErrors = signal<string[]>([]);

  // Top Up form
  topUpAmount = 25;
  selectedTopUpMethodId = '';
  topUpProcessing = signal<boolean>(false);
  readonly presetAmounts = [5, 10, 25, 50, 100];

  // Gift Card redemption form
  giftCode = '';
  redeemProcessing = signal<boolean>(false);

  // Computed Values
  readonly usdBalance = computed(() => formatUsd(this.wallet()?.balance ?? 0));
  readonly khrBalance = computed(() => approxKhr(this.wallet()?.balance ?? 0));
  readonly detectedBrand = computed(() => detectCardBrand(this.cardNumber));
  readonly defaultMethod = computed(() => this.methods().find(m => m.isDefault) ?? null);
  readonly khqrMethod = computed(() => this.methods().find(m => m.type === 'khqr') ?? null);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.loadData(user.id);
      }
    });
  }

  loadData(userId: string): void {
    this.loading.set(true);

    this.paymentsData.getMethods(userId).subscribe({
      next: methods => {
        this.methods.set(methods);
        const def = methods.find(m => m.isDefault);
        if (def) {
          this.selectedTopUpMethodId = def.id;
        } else if (methods.length > 0) {
          this.selectedTopUpMethodId = methods[0].id;
        }
      }
    });

    this.paymentsData.getWalletSnapshot(userId).subscribe({
      next: snapshot => {
        this.wallet.set(snapshot.wallet);
        this.transactions.set(snapshot.transactions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  // Set Default Method
  setDefault(methodId: string): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.paymentsData.setDefaultMethod(user.id, methodId).subscribe({
      next: updated => {
        this.methods.set(updated);
        this.showToast('Default payment method updated successfully.');
      }
    });
  }

  // Remove Modal
  openRemoveModal(method: PaymentMethod): void {
    this.methodToRemove.set(method);
  }

  closeRemoveModal(): void {
    this.methodToRemove.set(null);
  }

  confirmRemove(): void {
    const user = this.auth.currentUser();
    const victim = this.methodToRemove();
    if (!user || !victim) return;

    this.paymentsData.removeMethod(user.id, victim.id).subscribe({
      next: updated => {
        this.methods.set(updated);
        this.closeRemoveModal();
        this.showToast('Payment method removed.');
      }
    });
  }

  // Add Method Modal
  openAddModal(): void {
    this.cardHolder = this.auth.currentUser()?.displayName ?? '';
    this.cardNumber = '';
    this.cardExpiry = '';
    this.cardCvv = '';
    this.cardFormErrors.set([]);

    this.khqrBank = 'ABA';
    this.khqrHandle = (this.auth.currentUser()?.displayName?.toLowerCase().replace(/\s+/g, '') ?? 'user') + '@aba';
    this.khqrLinking.set(false);
    this.khqrFormErrors.set([]);

    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  submitAddCard(): void {
    const user = this.auth.currentUser();
    if (!user) return;

    const brand = this.detectedBrand();
    const dto: AddCardMethodDto = {
      type: 'card',
      brand: brand ?? 'visa',
      holder: this.cardHolder.trim(),
      number: this.cardNumber.replace(/\s+/g, ''),
      expiry: this.cardExpiry.trim()
    };

    const validation = validateCardInput(dto, this.methods());
    if (!validation.valid) {
      this.cardFormErrors.set(validation.errors);
      return;
    }

    this.paymentsData.addMethod(user.id, dto).subscribe({
      next: result => {
        if (result.ok) {
          this.paymentsData.getMethods(user.id).subscribe(m => this.methods.set(m));
          this.closeAddModal();
          this.showToast('Credit card added securely.');
        } else {
          this.cardFormErrors.set(result.errors);
        }
      }
    });
  }

  submitAddKhqr(): void {
    const user = this.auth.currentUser();
    if (!user) return;

    const handle = this.khqrHandle.trim();
    if (handle.length < 3) {
      this.khqrFormErrors.set(['Please enter a valid bank account handle.']);
      return;
    }

    const dto: AddKhqrMethodDto = {
      type: 'khqr',
      bank: this.khqrBank,
      handle
    };

    this.khqrLinking.set(true);

    // Simulate authentic Bakong handshake (1.2s)
    setTimeout(() => {
      this.paymentsData.addMethod(user.id, dto).subscribe({
        next: result => {
          this.khqrLinking.set(false);
          if (result.ok) {
            this.paymentsData.getMethods(user.id).subscribe(m => this.methods.set(m));
            this.closeAddModal();
            this.showToast(`${this.khqrBank} KHQR linked successfully.`);
          } else {
            this.khqrFormErrors.set(result.errors);
          }
        },
        error: () => {
          this.khqrLinking.set(false);
          this.khqrFormErrors.set(['Failed to link bank account. Please try again.']);
        }
      });
    }, 1200);
  }

  // Top Up Modal
  openTopUpModal(): void {
    const def = this.defaultMethod();
    if (def) {
      this.selectedTopUpMethodId = def.id;
    } else if (this.methods().length > 0) {
      this.selectedTopUpMethodId = this.methods()[0].id;
    }
    this.topUpAmount = 25;
    this.showTopUpModal.set(true);
  }

  closeTopUpModal(): void {
    this.showTopUpModal.set(false);
    this.topUpProcessing.set(false);
  }

  selectPresetAmount(amt: number): void {
    this.topUpAmount = amt;
  }

  submitTopUp(): void {
    const user = this.auth.currentUser();
    if (!user || this.topUpAmount <= 0 || !this.selectedTopUpMethodId) return;

    this.topUpProcessing.set(true);
    setTimeout(() => {
      this.paymentsData.topUp(user.id, this.topUpAmount, this.selectedTopUpMethodId).subscribe({
        next: res => {
          this.wallet.set(res.wallet);
          this.transactions.update(txs => [res.transaction, ...txs]);
          this.closeTopUpModal();
          this.showToast(`Wallet credited with ${formatUsd(this.topUpAmount)}.`);
        },
        error: () => {
          this.topUpProcessing.set(false);
          this.showError('Failed to process wallet top-up.');
        }
      });
    }, 800);
  }

  // Gift Card Redemption
  submitRedeemGiftCode(): void {
    const user = this.auth.currentUser();
    const code = this.giftCode.trim();
    if (!user || !code) return;

    this.redeemProcessing.set(true);

    this.paymentsData.redeemGiftCode(user.id, code).subscribe({
      next: result => {
        this.redeemProcessing.set(false);
        if (result.ok) {
          this.wallet.update(w => w ? { ...w, balance: result.balance } : null);
          this.transactions.update(txs => [result.transaction, ...txs]);
          this.giftCode = '';
          this.showToast(`Gift code redeemed! ${formatUsd(result.amount)} added to wallet.`);
        } else {
          if (result.reason === 'already_redeemed') {
            this.showError('This gift card code has already been redeemed.');
          } else {
            this.showError('Invalid gift card code. Please check and try again.');
          }
        }
      },
      error: () => {
        this.redeemProcessing.set(false);
        this.showError('Failed to redeem gift card.');
      }
    });
  }

  private showToast(msg: string): void {
    this.alertSuccess.set(msg);
    this.alertError.set(null);
    setTimeout(() => {
      this.alertSuccess.set(null);
    }, 4000);
  }

  private showError(msg: string): void {
    this.alertError.set(msg);
    this.alertSuccess.set(null);
    setTimeout(() => {
      this.alertError.set(null);
    }, 4000);
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.showAddModal()) this.closeAddModal();
    if (this.showTopUpModal()) this.closeTopUpModal();
    if (this.methodToRemove()) this.closeRemoveModal();
  }

  formatDate(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

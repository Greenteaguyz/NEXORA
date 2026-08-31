import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PAYMENTS_DATA } from '../../core/data/tokens';
import { PaymentMethod, Wallet, WalletTransaction } from '../../core/models/payment.model';
import { formatGiftCode, formatUsd } from '../../core/data/payments/payment-logic';
import { PaymentBrandMarkComponent } from '../../shared/ui/payment-brand-mark/payment-brand-mark.component';
import { KhqrCardComponent } from '../../shared/ui/khqr-card/khqr-card.component';
import { ScrollLockDirective } from '../../shared/directives/scroll-lock.directive';
import { AddPaymentMethodFormComponent } from '../../shared/ui/add-payment-method-form/add-payment-method-form.component';

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
    AddPaymentMethodFormComponent
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
  readonly methodToRemove = signal<PaymentMethod | null>(null);
  readonly showTopUpModal = signal<boolean>(false);
  readonly selectedTransaction = signal<WalletTransaction | null>(null);

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
  readonly cardMethods = computed(() => this.methods().filter(m => m.type === 'card'));
  readonly displayedMethods = computed(() => this.auth.isCreator() ? this.methods() : this.cardMethods());
  readonly defaultMethod = computed(() => this.displayedMethods().find(m => m.isDefault) ?? null);
  readonly khqrMethod = computed(() => this.methods().find(m => m.type === 'khqr') ?? null);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.loadData(user.id);
      }
    }, { allowSignalWrites: true });
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
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  onMethodAdded(method: PaymentMethod): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this.paymentsData.getMethods(user.id).subscribe(m => this.methods.set(m));
    this.closeAddModal();
    if (method.type === 'card') {
      this.showToast('Credit card added securely.');
    } else {
      this.showToast(`${method.bank} KHQR linked successfully.`);
    }
  }

  // Top Up Modal
  openTopUpModal(): void {
    const cards = this.cardMethods();
    const defCard = cards.find(m => m.isDefault);
    if (defCard) {
      this.selectedTopUpMethodId = defCard.id;
    } else if (cards.length > 0) {
      this.selectedTopUpMethodId = cards[0].id;
    } else {
      this.selectedTopUpMethodId = '';
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
  onGiftCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatGiftCode(input.value);
    this.giftCode = formatted;
    input.value = formatted;
  }

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

  // Detailed Transaction View
  openTransactionDetails(tx: WalletTransaction): void {
    this.selectedTransaction.set(tx);
  }

  closeTransactionDetails(): void {
    this.selectedTransaction.set(null);
  }

  copyTransactionId(id: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id).then(() => {
        this.showToast(`Transaction ID copied: ${id}`);
      }).catch(() => {
        this.showToast(`Copied: ${id}`);
      });
    } else {
      this.showToast(`Copied: ${id}`);
    }
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
    if (this.selectedTransaction()) this.closeTransactionDetails();
    if (this.showAddModal()) this.closeAddModal();
    if (this.showTopUpModal()) this.closeTopUpModal();
    if (this.methodToRemove()) this.closeRemoveModal();
  }

  formatDate(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

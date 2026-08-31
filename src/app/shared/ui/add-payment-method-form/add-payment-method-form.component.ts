import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { PAYMENTS_DATA } from '../../../core/data/tokens';
import { AddCardMethodDto, AddKhqrMethodDto, KhqrBank, PaymentMethod } from '../../../core/models/payment.model';
import { detectCardBrand, validateCardInput } from '../../../core/data/payments/payment-logic';
import { PaymentBrandMarkComponent } from '../payment-brand-mark/payment-brand-mark.component';
import { ExpiryDateDirective } from '../../directives/expiry-date.directive';
import { CardNumberDirective } from '../../directives/card-number.directive';
import { CvvDirective } from '../../directives/cvv.directive';

/**
 * Shared "Add Payment Method" form — the single source of truth for saving
 * card and Bakong KHQR methods. Hosted by the account-payment page (add
 * modal) and the purchase-confirm modal (inline panel), so validation,
 * handshake simulation and error rendering live in exactly one place.
 *
 * Emits the persisted method via `added`; hosts own list refresh and
 * post-add selection. Inputs are optional — the form prefills holder/handle
 * hints from the current session user by itself.
 */
@Component({
  selector: 'app-add-payment-method-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PaymentBrandMarkComponent, ExpiryDateDirective, CardNumberDirective, CvvDirective],
  templateUrl: './add-payment-method-form.component.html',
  styleUrl: './add-payment-method-form.component.css'
})
export class AddPaymentMethodFormComponent {
  /** Existing methods used for duplicate detection during validation. */
  readonly methods = input<PaymentMethod[]>([]);
  /** Compact variant for inline checkout panels (smaller paddings). */
  readonly compact = input(false);

  readonly added = output<PaymentMethod>();
  readonly cancel = output<void>();

  readonly auth = inject(AuthService);
  private readonly paymentsData = inject(PAYMENTS_DATA);


  readonly activeTab = signal<'card' | 'khqr'>('card');

  // Card form
  cardHolder = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  readonly cardFormErrors = signal<string[]>([]);
  readonly savingCard = signal(false);

  // KHQR form
  khqrBank: KhqrBankPick = 'ABA';
  khqrHandle = '';
  readonly khqrLinking = signal(false);
  readonly khqrFormErrors = signal<string[]>([]);

  constructor() {
    const user = this.auth.currentUser();
    this.cardHolder = user?.displayName ?? '';
    this.khqrHandle = (user?.displayName?.toLowerCase().replace(/\s+/g, '') ?? 'user') + '@aba';
  }

  get detectedBrand(): 'visa' | 'mastercard' | null {
    return detectCardBrand(this.cardNumber);
  }

  selectTab(tab: 'card' | 'khqr'): void {
    this.activeTab.set(tab);
  }

  submitCard(): void {
    if (this.savingCard()) return;
    const user = this.auth.currentUser();
    if (!user) return;

    this.cardFormErrors.set([]);
    const dto: AddCardMethodDto = {
      type: 'card',
      brand: detectCardBrand(this.cardNumber) ?? 'visa',
      holder: this.cardHolder.trim(),
      number: this.cardNumber.replace(/\s+/g, ''),
      expiry: this.cardExpiry.trim()
    };

    const validation = validateCardInput(dto, this.methods());
    if (!validation.valid) {
      this.cardFormErrors.set(validation.errors);
      return;
    }

    this.savingCard.set(true);
    this.paymentsData.addMethod(user.id, dto).subscribe(result => {
      this.savingCard.set(false);
      if (result.ok) {
        this.added.emit(result.method);
      } else {
        this.cardFormErrors.set((result as { errors?: string[] }).errors ?? ['Failed to save card.']);
      }
    });
  }

  submitKhqr(): void {
    if (this.khqrLinking()) return;
    const user = this.auth.currentUser();
    if (!user) return;

    this.khqrFormErrors.set([]);
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
    // Simulated Bakong handshake (1.2s)
    setTimeout(() => {
      this.paymentsData.addMethod(user.id, dto).subscribe({
        next: result => {
          this.khqrLinking.set(false);
          if (result.ok) {
            this.added.emit(result.method);
          } else {
            this.khqrFormErrors.set((result as { errors?: string[] }).errors ?? ['Failed to link bank account.']);
          }
        },
        error: () => {
          this.khqrLinking.set(false);
          this.khqrFormErrors.set(['Failed to link bank account. Please try again.']);
        }
      });
    }, 1200);
  }

  emitCancel(): void {
    this.cancel.emit();
  }
}

type KhqrBankPick = Exclude<KhqrBank, 'Bakong'>;

import { Component, Input, Output, EventEmitter, HostListener, OnInit, ElementRef, ViewChild, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Game } from '../../../core/models/game.model';

export interface PurchaseConfirmationEvent {
  paymentMethod: string;
}

@Component({
  selector: 'app-purchase-confirm-modal',
  standalone: true,
  imports: [CommonModule],
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

  readonly selectedCardBrand = signal<'visa' | 'mastercard'>('visa');
  readonly cardNumber = computed(() => this.selectedCardBrand() === 'visa' ? '•••• •••• •••• 4242' : '•••• •••• •••• 5555');
  readonly cardHolder = signal('Bob (Verified)');
  readonly cardExpiry = signal('08/29');
  readonly cardCvc = signal('•••');

  ngOnInit(): void {
    // Prevent background scrolling while modal is open
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      this.confirmBtn?.nativeElement.focus();
    }, 50);
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  setCardBrand(brand: 'visa' | 'mastercard'): void {
    this.selectedCardBrand.set(brand);
  }

  get formattedPaymentMethod(): string {
    return this.selectedCardBrand() === 'visa' 
      ? 'Credit Card (Visa •••• 4242)' 
      : 'Credit Card (Mastercard •••• 5555)';
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
}

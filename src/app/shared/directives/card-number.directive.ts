import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { groupCardNumber } from '../../core/data/payments/payment-logic';

/**
 * Formats a card-number input as 4-digit groups while typing: strips
 * non-digits, caps at 16 digits ('4242 4242 4242 4242'), preserves the
 * caret, and blocks non-numeric keys (editing and modifier keys stay
 * usable). Syncs NgControl with emitEvent: false to avoid valueChanges
 * loops; template-driven ngModel inputs work via the host value binding.
 */
@Directive({
  selector: '[appCardNumber]',
  standalone: true
})
export class CardNumberDirective {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  @HostListener('input', ['$event'])
  onInput(event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    const previousValue = input.value;
    const previousCaret = input.selectionStart ?? previousValue.length;

    const formattedValue = groupCardNumber(previousValue);
    if (formattedValue === previousValue) {
      return;
    }

    input.value = formattedValue;

    const wasAtEnd = previousCaret >= previousValue.length;
    const newCaret = wasAtEnd
      ? formattedValue.length
      : Math.max(0, Math.min(previousCaret + (formattedValue.length - previousValue.length), formattedValue.length));
    input.setSelectionRange(newCaret, newCaret);

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(formattedValue, { emitEvent: false });
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }
}

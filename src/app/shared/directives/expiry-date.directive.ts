import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatExpiry } from '../../core/data/payments/payment-logic';

/**
 * Formats a card-expiry input as MM/YY while typing: strips non-digits,
 * caps at 4 digits, auto-inserts the slash after the second digit, and
 * preserves the caret position. Non-numeric keys are blocked (editing and
 * modifier keys stay usable). When a ReactiveForms/NgControl is present the
 * formatted value is written back with emitEvent: false to avoid
 * valueChanges loops; template-driven ngModel inputs work via the host
 * input's own value binding.
 */
@Directive({
  selector: '[appExpiryDate]',
  standalone: true
})
export class ExpiryDateDirective {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  @HostListener('input', ['$event'])
  onInput(event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    const previousValue = input.value;
    const previousCaret = input.selectionStart ?? previousValue.length;

    const formattedValue = formatExpiry(previousValue);
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

import { Directive, HostListener } from '@angular/core';

/**
 * Restricts an input to numeric entry with a 4-digit cap (CVV): blocks
 * non-numeric keys while keeping editing, navigation and modifier
 * shortcuts usable. Length is enforced on input so pasted values are
 * truncated safely.
 */
@Directive({
  selector: '[appCvv]',
  standalone: true
})
export class CvvDirective {
  @HostListener('input', ['$event'])
  onInput(event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    if (digits !== input.value) {
      input.value = digits;
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

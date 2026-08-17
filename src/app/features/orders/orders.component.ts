import { Component } from '@angular/core';

@Component({
  selector: 'app-orders',
  standalone: true,
  template: `
    <div style="max-width: 1320px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 2rem; font-weight: 800;">Order History</h1>
      <p style="margin-top: 16px; color: var(--color-text-secondary);">Your past purchases.</p>
    </div>
  `
})
export class OrdersComponent {}

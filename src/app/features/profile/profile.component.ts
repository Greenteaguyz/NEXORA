import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <div style="max-width: 1320px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 2rem; font-weight: 800;">Profile</h1>
      <p style="margin-top: 16px; color: var(--color-text-secondary);">Profile management coming soon.</p>
    </div>
  `
})
export class ProfileComponent {}

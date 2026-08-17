import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 32px 24px;">
      <h1 style="font-size: 5rem; font-weight: 900; color: var(--accent-500); line-height: 1;">404</h1>
      <h2 style="font-size: 1.5rem; font-weight: 700; margin: 16px 0 8px;">Level Not Found</h2>
      <p style="color: var(--text-secondary); max-width: 440px; margin-bottom: 24px; line-height: 1.5;">The page you are looking for might have been removed, renamed, or is temporarily unavailable.</p>
      <a routerLink="/catalog" class="btn-primary not-found-action" style="background-color: var(--accent-600); color: #fff; padding: 10px 20px; border-radius: var(--radius); font-weight: 600; text-decoration: none;">Back to Catalog</a>
    </div>
  `
})
export class NotFoundComponent {}

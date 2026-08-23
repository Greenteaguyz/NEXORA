import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="padding: 96px 24px; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
      <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; color: var(--accent-400); text-transform: uppercase; margin-bottom: 8px;">SYSTEM ERROR</span>
      <h1 style="font-family: var(--font-display); font-size: clamp(3.5rem, 6vw, 5.5rem); font-weight: 900; letter-spacing: -0.03em; color: var(--accent-400); line-height: 1; margin: 0;">404</h1>
      <h2 style="font-family: var(--font-display); font-size: clamp(1.4rem, 2vw, 1.8rem); font-weight: 800; color: var(--text-primary); margin: 16px 0 8px;">Level Not Found</h2>
      <p style="font-family: var(--font-sans); font-size: 0.95rem; color: var(--text-secondary); max-width: 460px; margin-bottom: 28px; line-height: 1.55;">The page you are looking for might have been moved, deleted, or does not exist in the NEXORA registry.</p>
      <a routerLink="/catalog" class="btn-primary not-found-action" style="font-family: var(--font-sans); background: var(--steam-btn-gradient); color: #FFFFFF; padding: 10px 24px; border-radius: var(--radius); font-weight: 700; font-size: 0.88rem; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);">
        <span>Back to Store Catalog</span>
      </a>
    </div>
  `
})
export class NotFoundComponent {}

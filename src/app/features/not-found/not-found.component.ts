import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div style="position: relative; padding: 80px 24px; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; overflow: hidden;">
      <div style="position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; max-width: 580px; width: 100%;">
        <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; color: var(--accent-400); text-transform: uppercase; margin-bottom: 8px;">SYSTEM ERROR</span>
        <h1 style="font-family: var(--font-display); font-size: clamp(3.5rem, 6vw, 5.5rem); font-weight: 900; letter-spacing: -0.03em; color: var(--accent-400); line-height: 1; margin: 0;">404</h1>
        <h2 style="font-family: var(--font-display); font-size: clamp(1.4rem, 2vw, 1.8rem); font-weight: 800; color: var(--text-primary); margin: 16px 0 8px;">Level Not Found</h2>
        <p style="font-family: var(--font-sans); font-size: 0.95rem; color: var(--text-secondary); max-width: 460px; margin-bottom: 24px; line-height: 1.55;">The coordinates you requested are outside the NEXORA registry. Try searching for the game or jump to a primary deck below.</p>
        
        <!-- Search Input -->
        <div style="position: relative; width: 100%; max-width: 440px; margin-bottom: 24px;">
          <svg style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted); pointer-events: none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (keydown.enter)="onSearch()"
            placeholder="Search game titles or genres..." 
            style="width: 100%; box-sizing: border-box; padding: 11px 88px 11px 38px; background: var(--bg-input, #0e141b); border: 1px solid var(--border-card, rgba(255, 255, 255, 0.15)); border-radius: var(--radius, 6px); color: var(--text-primary); font-size: 0.9rem; outline: none;"
            aria-label="Search games from 404">
          <button 
            type="button" 
            (click)="onSearch()"
            style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: var(--bg-elevated, #1b2838); border: 1px solid var(--border-card, rgba(255, 255, 255, 0.2)); color: var(--accent-400); font-size: 0.78rem; font-weight: 700; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
            Search
          </button>
        </div>

        <!-- Quick Recovery Links -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
          <a routerLink="/catalog" class="btn-primary not-found-action" style="font-family: var(--font-sans); background: var(--steam-btn-gradient); color: #FFFFFF; padding: 9px 18px; border-radius: var(--radius); font-weight: 700; font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35); transform: translateY(0);">
            <span>Store Catalog</span>
          </a>
          <a routerLink="/library" style="font-family: var(--font-sans); background: var(--bg-surface); border: 1px solid var(--border-card); color: var(--text-primary); padding: 9px 18px; border-radius: var(--radius); font-weight: 700; font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transform: translateY(0);">
            <span>Your Library</span>
          </a>
          <a routerLink="/wishlist" style="font-family: var(--font-sans); background: var(--bg-surface); border: 1px solid var(--border-card); color: var(--text-primary); padding: 9px 18px; border-radius: var(--radius); font-weight: 700; font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transform: translateY(0);">
            <span>Wishlist</span>
          </a>
          <a routerLink="/support" style="font-family: var(--font-sans); background: var(--bg-surface); border: 1px solid var(--border-card); color: var(--text-primary); padding: 9px 18px; border-radius: var(--radius); font-weight: 700; font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transform: translateY(0);">
            <span>Help Desk</span>
          </a>
        </div>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  private router = inject(Router);
  searchQuery = '';

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/catalog'], { queryParams: { q: this.searchQuery.trim() } });
    } else {
      this.router.navigate(['/catalog']);
    }
  }
}

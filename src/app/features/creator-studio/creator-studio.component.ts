import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-creator-studio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="max-width: 1320px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 2rem; font-weight: 800;">Creator Studio</h1>
      <a routerLink="/studio/games/new" style="display: inline-block; margin-top: 16px; background: var(--accent-600); color: #fff; padding: 8px 16px; border-radius: var(--radius);">Publish New Game</a>
    </div>
  `
})
export class CreatorStudioComponent {}

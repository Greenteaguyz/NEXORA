import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="max-width: 1320px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 2rem; font-weight: 800;">Game Listing Form</h1>
    </div>
  `
})
export class GameFormComponent {}

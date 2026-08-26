import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-genre-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg 
      class="genre-svg-icon" 
      [attr.width]="size()" 
      [attr.height]="size()" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      aria-hidden="true">
      @switch (normalizedGenre()) {
        @case ('action') {
          <!-- Action: High-voltage lightning bolt -->
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        }
        @case ('cyberpunk') {
          <!-- Cyberpunk: Neural microchip interface -->
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <circle cx="9" cy="9" r="1.5" />
          <circle cx="15" cy="9" r="1.5" />
          <path d="M8 15h8" />
          <path d="M12 4v3" />
          <path d="M12 17v3" />
          <path d="M4 12h3" />
          <path d="M17 12h3" />
        }
        @case ('rpg') {
          <!-- RPG: Ancient Grimoire / Spellbook with star talisman -->
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <polygon points="12 6 13.5 9 16.5 9.5 14.2 11.7 14.8 14.8 12 13.2 9.2 14.8 9.8 11.7 7.5 9.5 10.5 9 12 6" />
        }
        @case ('hack and slash') {
          <!-- Hack and Slash: Greatsword with dynamic motion slash -->
          <path d="M18 2l4 4L8 20l-4-1 1-4L18 2z" />
          <path d="M14 6l4 4" />
          <path d="M3 21l3-3" />
          <path d="M6 5C11 5 17 8 20 14" stroke-dasharray="2 2" />
        }
        @case ('pvp') {
          <!-- PvP: Dual Dueling Rapiers with Arena Ring -->
          <line x1="4" y1="4" x2="14" y2="14" />
          <line x1="4" y1="20" x2="14" y2="10" />
          <line x1="14" y1="14" x2="20" y2="20" />
          <line x1="14" y1="10" x2="20" y2="4" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('strategy') {
          <!-- Strategy: Castle Turret / Chess Rook -->
          <path d="M5 20h14" />
          <path d="M6 20V8l3-3h6l3 3v12" />
          <path d="M6 8h12" />
          <path d="M9 5v3" />
          <path d="M12 5v3" />
          <path d="M15 5v3" />
        }
        @case ('tactics') {
          <!-- Tactics: Hexagonal Battle Map with Target Crosshair -->
          <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
          <circle cx="12" cy="11" r="3" />
          <line x1="12" y1="5" x2="12" y2="8" />
          <line x1="12" y1="14" x2="12" y2="17" />
          <line x1="6" y1="11" x2="9" y2="11" />
          <line x1="15" y1="11" x2="18" y2="11" />
        }
        @case ('platformer') {
          <!-- Platformer: Ascending Stepped Ledges & Leap Arc -->
          <path d="M3 20h6" />
          <path d="M9 15h6" />
          <path d="M15 10h6" />
          <circle cx="6" cy="13" r="2" />
          <path d="M8 12c2-4 5-4 7-1" />
        }
        @case ('puzzle') {
          <!-- Puzzle: Jigsaw Key Piece -->
          <path d="M19.4 7.8c0-1.5.8-2.8 1.9-2.8V3h-5.4a3.8 3.8 0 0 0-7.7 0H3v5.4a3.8 3.8 0 0 1 0 7.7V21h5.4a3.8 3.8 0 0 0 7.7 0H21v-5.4a3.8 3.8 0 0 1 0-7.8z" />
        }
        @case ('racing') {
          <!-- Racing: Speedometer Gauge -->
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z" />
          <path d="M12 12l4-4" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 14l2-1" />
          <path d="M18 14l-2-1" />
        }
        @case ('arcade') {
          <!-- Arcade: Retro Joystick Cabinet Controls -->
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="8" cy="5" r="2.5" />
          <path d="M8 7.5V11" />
          <circle cx="14" cy="15" r="1.5" />
          <circle cx="17.5" cy="16.5" r="1.5" />
        }
        @case ('sci-fi') {
          <!-- Sci-Fi: Orbital Planet with Saturn Ring -->
          <circle cx="12" cy="12" r="6" />
          <path d="M3 15C5 8 19 8 21 15" />
          <circle cx="18" cy="5" r="1.5" />
        }
        @case ('pixel art') {
          <!-- Pixel Art: 8-Bit Stepped Heart -->
          <path d="M4 7h4v4H4zM8 3h4v4H8zM12 3h4v4h-4zM16 7h4v4h-4zM4 11h16v4H4zM6 15h12v4H6zM8 19h8v2H8z" />
        }
        @case ('roguelike') {
          <!-- Roguelike: 20-Sided Polyhedral D20 Die -->
          <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" />
          <polyline points="3 7 12 12 21 7" />
          <polyline points="12 12 12 22" />
          <polyline points="3 7 12 22 21 7" />
        }
        @case ('rogue-like') {
          <!-- Rogue-like alias: D20 Die -->
          <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" />
          <polyline points="3 7 12 12 21 7" />
          <polyline points="12 12 12 22" />
          <polyline points="3 7 12 22 21 7" />
        }
        @case ('retro') {
          <!-- Retro: 3.5" Vintage Floppy Disk -->
          <path d="M4 4h12l4 4v12H4V4z" />
          <path d="M8 4v5h8V4" />
          <rect x="7" y="13" width="10" height="7" rx="1" />
        }
        @case ('synthwave') {
          <!-- Synthwave: Wireframe Sunset Grid -->
          <circle cx="12" cy="9" r="4.5" />
          <line x1="2" y1="15" x2="22" y2="15" />
          <line x1="4" y1="18" x2="20" y2="18" />
          <line x1="7" y1="21" x2="17" y2="21" />
          <line x1="12" y1="15" x2="12" y2="21" />
          <line x1="7" y1="15" x2="4" y2="21" />
          <line x1="17" y1="15" x2="20" y2="21" />
        }
        @case ('hacking') {
          <!-- Hacking: Command-Line Terminal Prompt -->
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
          <line x1="14" y1="11" x2="18" y2="11" />
        }
        @case ('adventure') {
          <!-- Adventure: Navigational Compass Rose -->
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8" />
        }
        @case ('bullet hell') {
          <!-- Bullet Hell: Radial Burst Danmaku Array -->
          <circle cx="12" cy="12" r="2.5" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="4.9" y1="4.9" x2="7.8" y2="7.8" />
          <line x1="16.2" y1="16.2" x2="19.1" y2="19.1" />
          <line x1="4.9" y1="19.1" x2="7.8" y2="16.2" />
          <line x1="16.2" y1="7.8" x2="19.1" y2="4.9" />
        }
        @case ('horror') {
          <!-- Horror: Screaming Apparition Skull -->
          <path d="M12 2a8 8 0 0 0-8 8c0 4 2 7 3 9l2-1 3 3 3-3 2 1c1-2 3-5 3-9a8 8 0 0 0-8-8z" />
          <circle cx="9" cy="10" r="1.5" />
          <circle cx="15" cy="10" r="1.5" />
          <ellipse cx="12" cy="15" rx="1.5" ry="2" />
        }
        @case ('atmospheric') {
          <!-- Atmospheric: Crescent Moon over Foggy Peaks -->
          <path d="M12 3a8 8 0 1 0 8 8 6 6 0 0 1-8-8z" />
          <path d="M3 21l6-7 4 5 4-4 4 6" />
        }
        @case ('rhythm') {
          <!-- Rhythm: Audio Equalizer Spectrum Wave -->
          <line x1="4" y1="14" x2="4" y2="19" />
          <line x1="8" y1="7" x2="8" y2="19" />
          <line x1="12" y1="3" x2="12" y2="19" />
          <line x1="16" y1="9" x2="16" y2="19" />
          <line x1="20" y1="12" x2="20" y2="19" />
        }
        @case ('music') {
          <!-- Music: Beamed Musical Notes -->
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        }
        @case ('first-person') {
          <!-- First-Person: Sniper / Optic Reticle Viewfinder -->
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="3" x2="12" y2="7" />
          <line x1="12" y1="17" x2="12" y2="21" />
          <line x1="3" y1="12" x2="7" y2="12" />
          <line x1="17" y1="12" x2="21" y2="12" />
        }
        @case ('third-person') {
          <!-- Third-Person: Player Avatar with Perspective Camera -->
          <circle cx="12" cy="7" r="4" />
          <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
          <circle cx="19" cy="5" r="2" />
          <path d="M19 7v3" />
        }
        @case ('simulation') {
          <!-- Simulation: Control Panel Dials & Sliders -->
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8" cy="10" r="2" />
          <circle cx="16" cy="10" r="2" />
          <line x1="6" y1="16" x2="18" y2="16" />
        }
        @case ('story rich') {
          <!-- Story Rich: Open Tome with Writing Quill -->
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          <line x1="6" y1="8" x2="9" y2="8" />
          <line x1="6" y1="12" x2="9" y2="12" />
          <line x1="15" y1="8" x2="18" y2="8" />
          <line x1="15" y1="12" x2="18" y2="12" />
        }
        @case ('casual') {
          <!-- Casual: Warm Coffee Mug with Steam -->
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <path d="M6 2v3M10 2v3M14 2v3" />
        }
        @case ('mechs') {
          <!-- Mechs: Robotic Armored Titan Helmet -->
          <rect x="4" y="7" width="16" height="13" rx="2" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="7" y1="16" x2="17" y2="16" />
          <line x1="4" y1="2" x2="7" y2="7" />
          <line x1="20" y1="2" x2="17" y2="7" />
          <circle cx="12" cy="12" r="1.5" />
        }
        @case ('hero shooter') {
          <!-- Hero Shooter: Superhero Star Crest -->
          <polygon points="12 2 15 8 21 9 17 14 18 20 12 17 6 20 7 14 3 9 9 8 12 2" />
        }
        @case ('indie') {
          <!-- Indie: Faceted Sparkling Diamond Crystal -->
          <polygon points="6 3 18 3 22 9 12 22 2 9 6 3" />
          <line x1="2" y1="9" x2="22" y2="9" />
          <line x1="12" y1="22" x2="7" y2="9" />
          <line x1="12" y1="22" x2="17" y2="9" />
        }
        @default {
          <!-- Default: Gaming Controller -->
          <rect x="2" y="6" width="20" height="12" rx="6" />
          <line x1="6" y1="12" x2="10" y2="12" />
          <line x1="8" y1="10" x2="8" y2="14" />
          <circle cx="15.5" cy="10.5" r="1" />
          <circle cx="17.5" cy="12.5" r="1" />
        }
      }
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      width: 100%;
      height: 100%;
    }
    .genre-svg-icon {
      display: block;
      margin: auto;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
  `]
})
export class GenreIconComponent {
  tag = input.required<string>();
  size = input<number>(22);

  normalizedGenre(): string {
    return (this.tag() || '').toLowerCase().trim();
  }
}

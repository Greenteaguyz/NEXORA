import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GAMES_DATA } from '../../core/data/tokens';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';

interface GenreSummary {
  name: string;
  count: number;
  iconSvg: SafeHtml;
  description: string;
  accentColor: string;
}

@Component({
  selector: 'app-genres',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './genres.component.html',
  styleUrls: ['./genres.component.css']
})
export class GenresComponent implements OnInit {
  private gamesData = inject(GAMES_DATA);
  private sanitizer = inject(DomSanitizer);

  genresList: GenreSummary[] = [];
  featuredGenres: GenreSummary[] = [];
  allGenres: GenreSummary[] = [];
  searchQuery = '';
  loading = true;

  get filteredAllGenres(): GenreSummary[] {
    if (!this.searchQuery.trim()) {
      return this.allGenres;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return this.genresList.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q)
    );
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input?.value || '';
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  private genreMeta: Record<string, { svg: string; description: string; color: string }> = {
    'Cyberpunk': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
      description: 'High-tech low-life neon dystopias and neural interfaces.',
      color: '#66C0F4'
    },
    'Action': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
      description: 'High-octane reflexes, gunplay, and combat encounters.',
      color: '#F43F5E'
    },
    'RPG': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/><line x1="7" y1="17" x2="4" y2="20"/><line x1="3" y1="19" x2="5" y2="21"/></svg>`,
      description: 'Deep character progression, story decisions, and sprawling quests.',
      color: '#F59E0B'
    },
    'Strategy': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04z"/></svg>`,
      description: 'Tactical planning, deckbuilding, and resource management.',
      color: '#10B981'
    },
    'Platformer': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 16 4-4 4 4 8-8"/><path d="M16 8h4v4"/><path d="M3 21h18"/></svg>`,
      description: 'Precision jumps, momentum puzzles, and time trials.',
      color: '#06B6D4'
    },
    'Puzzle': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.439 7.85c0-1.57.875-2.85 1.96-2.85v-2h-5.4a3.85 3.85 0 0 0-7.7 0H2.899v5.4a3.85 3.85 0 0 1 0 7.7v5.4h5.4a3.85 3.85 0 0 0 7.7 0h5.4v-5.4a3.85 3.85 0 0 1 0-7.7v-.5z"/></svg>`,
      description: 'Logic riddles, hacking terminals, and mind-bending challenges.',
      color: '#EC4899'
    },
    'Racing': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z"/><path d="M12 12l4-4"/><circle cx="12" cy="12" r="2"/></svg>`,
      description: 'Synthwave highways, high-speed hovercrafts, and drift tracks.',
      color: '#3B82F6'
    },
    'Arcade': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z"/><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="7" y1="16" x2="7.01" y2="16"/><line x1="17" y1="16" x2="17.01" y2="16"/></svg>`,
      description: 'Retro coin-op vibes, score attacks, and endless runners.',
      color: '#F97316'
    },
    'Sci-Fi': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
      description: 'Deep space exploration, derelict stations, and alien tech.',
      color: '#66C0F4'
    },
    'Pixel Art': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
      description: 'Handcrafted pixel aesthetic and nostalgic 16-bit beauty.',
      color: '#14B8A6'
    },
    'Rogue-like': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
      description: 'Procedural runs, permadeath, and emergent synergies.',
      color: '#E11D48'
    },
    'Roguelike': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
      description: 'Procedural runs, permadeath, and emergent synergies.',
      color: '#E11D48'
    },
    'Retro': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
      description: 'Classic 8-bit / 16-bit nostalgia with vintage gameplay loops.',
      color: '#F59E0B'
    },
    'Synthwave': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="6"/><path d="M2 18h20"/><path d="M4 22h16"/><path d="M12 16v6"/><path d="M7 18l-2 4"/><path d="M17 18l2 4"/></svg>`,
      description: 'Outrun sunsets, pulsing retro synths, and neon visual style.',
      color: '#0284C7'
    },
    'Tactics': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>`,
      description: 'Turn-based grid battles, positional strategy, and squad control.',
      color: '#059669'
    },
    'Hacking': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
      description: 'Cyber warfare, data infiltration, and terminal breach sims.',
      color: '#06B6D4'
    },
    'Adventure': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
      description: 'Immersive worlds, narrative journeys, and hidden secrets.',
      color: '#EAB308'
    },
    'Bullet Hell': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
      description: 'Screen-filling projectile patterns and razor-thin dodge windows.',
      color: '#EF4444'
    },
    'Horror': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>`,
      description: 'Atmospheric dread, survival instincts, and psychological tension.',
      color: '#991B1B'
    },
    'Atmospheric': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
      description: 'Moody ambient lighting, deep soundtracks, and evocative moods.',
      color: '#64748B'
    },
    'Rhythm': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
      description: 'Beat-synced obstacle courses and music-driven gameplay.',
      color: '#75B022'
    },
    'Music': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
      description: 'Sonic soundscapes, interactive audio, and rhythm mechanics.',
      color: '#66C0F4'
    },
    'First-Person': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
      description: 'Direct point-of-view immersion, exploration, and spatial solving.',
      color: '#2563EB'
    },
    'Indie': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>`,
      description: 'Passion-driven games from solo developers and small studios.',
      color: '#75B022'
    },
    'Hack and Slash': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/></svg>`,
      description: 'Fluid combo chains, fast weapon melee, and mob clearing.',
      color: '#DC2626'
    },
    'Simulation': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
      description: 'Detailed systems, management sims, and lifelike environments.',
      color: '#0D9488'
    },
    'Story Rich': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
      description: 'Branching dialogue, character-driven narratives, and deep lore.',
      color: '#D97706'
    },
    'Casual': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
      description: 'Relaxing, low-stress experiences you can enjoy anytime.',
      color: '#FBBF24'
    },
    'Mechs': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/><path d="M9 2v3"/><path d="M15 2v3"/></svg>`,
      description: 'Armored walking tanks, heavy loadouts, and mechanized combat.',
      color: '#64748B'
    },
    'Hero Shooter': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>`,
      description: 'Team-based character abilities, ultimate synergy, and dynamic power loadouts.',
      color: '#66C0F4'
    },
    'Third-Person': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"/></svg>`,
      description: 'Over-the-shoulder action, full character visibility, and dynamic spatial awareness.',
      color: '#06B6D4'
    },
    'PvP': {
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><path d="M14.5 6.5L18 3h3v3l-9.5 9.5"/></svg>`,
      description: 'Player-versus-player competitive arenas, team matches, and ranked ladder combat.',
      color: '#EF4444'
    }
  };

  private defaultMeta = {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="6"/></svg>`,
    description: 'Discover indie games in this category on NEXORA.',
    color: '#66C0F4'
  };

  ngOnInit(): void {
    this.loadGenres();
  }

  loadGenres(): void {
    this.loading = true;
    this.gamesData.getGames().subscribe(games => {
      const counts: Record<string, number> = {};

      games.forEach(game => {
        game.tags.forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });

      const sorted = Object.keys(counts).map(tag => {
        const meta = this.genreMeta[tag] || this.defaultMeta;
        return {
          name: tag,
          count: counts[tag],
          iconSvg: this.sanitizer.bypassSecurityTrustHtml(meta.svg),
          description: meta.description,
          accentColor: meta.color
        };
      }).sort((a, b) => b.count - a.count);

      this.genresList = sorted;
      this.featuredGenres = sorted.slice(0, 4);
      this.allGenres = sorted.slice(4);

      this.loading = false;
    });
  }
}


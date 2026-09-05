import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GAMES_DATA } from '../../core/data/tokens';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { GenreIconComponent } from '../../shared/ui/genre-icon/genre-icon.component';

import { TranslationService } from '../../core/services/translation.service';

export interface GenreSummary {
  name: string;
  count: number;
  description: string;
  accentColor: string;
}

@Component({
  selector: 'app-genres',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, GenreIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './genres.component.html',
  styleUrls: ['./genres.component.css']
})
export class GenresComponent implements OnInit {
  private gamesData = inject(GAMES_DATA);
  protected translationService = inject(TranslationService);
  readonly t = this.translationService.t;

  genresList = signal<GenreSummary[]>([]);
  searchQuery = signal<string>('');
  loading = signal<boolean>(true);

  readonly CORE_GENRE_NAMES = new Set([
    'Action', 'Sci-Fi', 'Cyberpunk', 'RPG', 'Strategy', 'Adventure', 'Platformer', 'Retro', 'Tactics'
  ]);

  filteredGenres = computed(() => {
    const list = this.genresList();
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) {
      return list;
    }
    return list.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q)
    );
  });

  coreGenres = computed(() => {
    return this.filteredGenres().filter(g => this.CORE_GENRE_NAMES.has(g.name));
  });

  subGenres = computed(() => {
    return this.filteredGenres().filter(g => !this.CORE_GENRE_NAMES.has(g.name));
  });

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input?.value || '');
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  private genreMeta: Record<string, { description: string; color: string }> = {
    'Cyberpunk': {
      description: 'High-tech low-life neon dystopias and neural interfaces.',
      color: '#66C0F4'
    },
    'Action': {
      description: 'High-octane reflexes, gunplay, and combat encounters.',
      color: '#F43F5E'
    },
    'RPG': {
      description: 'Deep character progression, story decisions, and sprawling quests.',
      color: '#F59E0B'
    },
    'Strategy': {
      description: 'Tactical planning, deckbuilding, and resource management.',
      color: '#10B981'
    },
    'Platformer': {
      description: 'Precision jumps, momentum puzzles, and time trials.',
      color: '#06B6D4'
    },
    'Puzzle': {
      description: 'Logic riddles, hacking terminals, and mind-bending challenges.',
      color: '#EC4899'
    },
    'Racing': {
      description: 'Synthwave highways, high-speed hovercrafts, and drift tracks.',
      color: '#3B82F6'
    },
    'Arcade': {
      description: 'Retro coin-op vibes, score attacks, and endless runners.',
      color: '#F97316'
    },
    'Sci-Fi': {
      description: 'Deep space exploration, derelict stations, and alien tech.',
      color: '#66C0F4'
    },
    'Pixel Art': {
      description: 'Pixel art, retro aesthetics, and 16-bit gameplay.',
      color: '#A78BFA'
    },
    'Rogue-like': {
      description: 'Procedural runs, permadeath, and emergent synergies.',
      color: '#E11D48'
    },
    'Roguelike': {
      description: 'Procedural runs, permadeath, and emergent synergies.',
      color: '#E11D48'
    },
    'Retro': {
      description: 'Classic 8-bit / 16-bit nostalgia with vintage gameplay loops.',
      color: '#F59E0B'
    },
    'Synthwave': {
      description: 'Outrun sunsets, pulsing retro synths, and neon visual style.',
      color: '#0284C7'
    },
    'Tactics': {
      description: 'Turn-based grid battles, positional strategy, and squad control.',
      color: '#059669'
    },
    'Hacking': {
      description: 'Cyber warfare, data infiltration, and terminal breach sims.',
      color: '#06B6D4'
    },
    'Adventure': {
      description: 'Immersive worlds, narrative journeys, and hidden secrets.',
      color: '#EAB308'
    },
    'Bullet Hell': {
      description: 'Screen-filling projectile patterns and razor-thin dodge windows.',
      color: '#EF4444'
    },
    'Horror': {
      description: 'Atmospheric dread, survival instincts, and psychological tension.',
      color: '#EF4444'
    },
    'Atmospheric': {
      description: 'Moody ambient lighting, deep soundtracks, and evocative moods.',
      color: '#38BDF8'
    },
    'Rhythm': {
      description: 'Beat-synced obstacle courses and music-driven gameplay.',
      color: '#A3E635'
    },
    'Music': {
      description: 'Sonic soundscapes, interactive audio, and rhythm mechanics.',
      color: '#66C0F4'
    },
    'First-Person': {
      description: 'Direct point-of-view immersion, exploration, and spatial solving.',
      color: '#60A5FA'
    },
    'Indie': {
      description: 'Games from solo developers and small studios.',
      color: '#34D399'
    },
    'Hack and Slash': {
      description: 'Fluid combo chains, fast weapon melee, and mob clearing.',
      color: '#F87171'
    },
    'Simulation': {
      description: 'Detailed systems, management sims, and lifelike environments.',
      color: '#2DD4BF'
    },
    'Story Rich': {
      description: 'Branching dialogue, character-driven narratives, and deep lore.',
      color: '#FBBF24'
    },
    'Casual': {
      description: 'Relaxing, low-stress games you can play anytime.',
      color: '#F472B6'
    },
    'Mechs': {
      description: 'Armored walking tanks, heavy loadouts, and mechanized combat.',
      color: '#38BDF8'
    },
    'Hero Shooter': {
      description: 'Team-based character abilities, ultimate synergy, and dynamic power loadouts.',
      color: '#66C0F4'
    },
    'Third-Person': {
      description: 'Over-the-shoulder action, full character visibility, and dynamic spatial awareness.',
      color: '#06B6D4'
    },
    'PvP': {
      description: 'Player-versus-player competitive arenas, team matches, and ranked ladder combat.',
      color: '#EF4444'
    }
  };

  private defaultMeta = {
    description: 'Games tagged in this category on NEXORA.',
    color: '#66C0F4'
  };

  ngOnInit(): void {
    this.loadGenres();
  }

  loadGenres(): void {
    this.loading.set(true);
    this.gamesData.getGames().subscribe(games => {
      const counts: Record<string, number> = {};

      games.forEach(game => {
        game.tags.forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });

      const sorted: GenreSummary[] = Object.keys(counts).map(tag => {
        const meta = this.genreMeta[tag] || this.defaultMeta;
        return {
          name: tag,
          count: counts[tag],
          description: meta.description,
          accentColor: meta.color
        };
      }).sort((a, b) => b.count !== a.count ? b.count - a.count : a.name.localeCompare(b.name));

      this.genresList.set(sorted);
      this.loading.set(false);
    });
  }
}

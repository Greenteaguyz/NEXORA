import { Component, ElementRef, HostListener, ViewChild, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GAMES_DATA } from '../../../core/data/tokens';
import { AuthService } from '../../../core/auth/auth.service';
import { Game } from '../../../core/models/game.model';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Pages' | 'Games' | 'Actions';
  subtitle?: string;
  icon?: string;
  route?: string;
  action?: () => void;
  price?: number;
  tags?: string[];
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.css']
})
export class CommandPaletteComponent {
  private gamesData = inject(GAMES_DATA);
  private router = inject(Router);
  private auth = inject(AuthService);

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  isOpen = signal(false);
  searchQuery = signal('');
  selectedIndex = signal(0);

  games = signal<Game[]>([]);

  readonly navCommands: CommandItem[] = [
    { id: 'nav-store', title: 'Store Catalog', category: 'Pages', subtitle: 'Browse all games & new releases', icon: 'store', route: '/catalog' },
    { id: 'nav-genres', title: 'Browse Genres', category: 'Pages', subtitle: 'Explore subgenres & categories', icon: 'tag', route: '/genres' },
    { id: 'nav-library', title: 'My Library', category: 'Pages', subtitle: 'View owned games & installations', icon: 'gamepad', route: '/library' },
    { id: 'nav-wishlist', title: 'My Wishlist', category: 'Pages', subtitle: 'View saved titles', icon: 'heart', route: '/wishlist' },
    { id: 'nav-orders', title: 'Purchase History', category: 'Pages', subtitle: 'View past orders & receipts', icon: 'receipt', route: '/orders' },
    { id: 'nav-studio', title: 'Creator Studio', category: 'Pages', subtitle: 'Developer publishing tools', icon: 'code', route: '/studio' },
    { id: 'nav-support', title: 'Help & Support', category: 'Pages', subtitle: 'Knowledge base & ticketing', icon: 'help', route: '/support' },
    { id: 'nav-profile', title: 'Account Settings', category: 'Pages', subtitle: 'Edit profile & preferences', icon: 'user', route: '/profile' }
  ];

  filteredItems = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const allGames = this.games();

    const gameItems: CommandItem[] = allGames.map(g => ({
      id: `game-${g.id}`,
      title: g.title,
      category: 'Games',
      subtitle: `${(g.tags && g.tags[0]) || 'Game'} • ${g.price === 0 ? 'FREE' : '$' + g.price.toFixed(2)}`,
      route: `/games/${g.id}`,
      price: g.price,
      tags: g.tags
    }));

    if (!q) {
      return [...this.navCommands.slice(0, 5), ...gameItems.slice(0, 4)];
    }

    const matchedNav = this.navCommands.filter(
      item => item.title.toLowerCase().includes(q) || (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );

    const matchedGames = gameItems.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
    );

    return [...matchedNav, ...matchedGames];
  });

  constructor() {
    this.gamesData.getGames().subscribe(gamesList => {
      this.games.set(gamesList || []);
    });

    effect(() => {
      if (this.isOpen()) {
        this.selectedIndex.set(0);
        setTimeout(() => {
          if (this.searchInputRef) {
            this.searchInputRef.nativeElement.focus();
          }
        }, 50);
      } else {
        this.searchQuery.set('');
      }
    });
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('window:open-command-palette')
  onOpenCommandPaletteEvent(): void {
    this.open();
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent): void {
    // Cross-platform normalized Ctrl+K or Cmd+K
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      event.stopPropagation();
      this.isOpen.update(v => !v);
      return;
    }

    if (!this.isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const count = this.filteredItems().length;
      if (count > 0) {
        this.selectedIndex.update(i => (i + 1) % count);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const count = this.filteredItems().length;
      if (count > 0) {
        this.selectedIndex.update(i => (i - 1 + count) % count);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const items = this.filteredItems();
      const idx = this.selectedIndex();
      if (items[idx]) {
        this.executeCommand(items[idx]);
      }
    }
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.selectedIndex.set(0);
  }

  executeCommand(item: CommandItem): void {
    this.close();
    if (item.action) {
      item.action();
    } else if (item.route) {
      this.router.navigateByUrl(item.route);
    }
  }
}

import { Component, ElementRef, HostListener, ViewChild, inject, signal, computed, OnInit, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GAMES_DATA } from '../../../core/data/tokens';
import { AuthService } from '../../../core/auth/auth.service';
import { CommandPaletteService } from '../../../core/services/command-palette.service';
import { TranslationService } from '../../../core/services/translation.service';
import { ScrollLockDirective } from '../../directives/scroll-lock.directive';
import { Game } from '../../../core/models/game.model';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Games' | 'Pages';
  subtitle?: string;
  icon?: string;
  route?: string;
  action?: () => void;
  price?: number;
  tags?: string[];
  coverImageUrl?: string;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, ScrollLockDirective],
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.css']
})
export class CommandPaletteComponent implements OnInit {
  private gamesData = inject(GAMES_DATA);
  private router = inject(Router);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private paletteService = inject(CommandPaletteService);
  private translationService = inject(TranslationService);
  t = this.translationService.t;

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  isOpen = this.paletteService.isOpen;
  searchQuery = signal('');
  selectedIndex = signal(0);

  games = signal<Game[]>([]);

  ngOnInit(): void {
    this.loadGames();
  }

  private loadGames(): void {
    this.gamesData.getGames().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(games => {
      this.games.set(games);
    });
  }

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

  private tokenize(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter(t => t.length > 0);
  }

  filteredItems = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const allGames = this.games();

    const gameItems: CommandItem[] = allGames.map(g => ({
      id: `game-${g.id}`,
      title: g.title,
      category: 'Games',
      subtitle: (g.tags && g.tags.slice(0, 2).join(', ')) || 'Game',
      route: `/games/${g.id}`,
      price: g.price,
      tags: g.tags,
      coverImageUrl: g.coverImageUrl
    }));

    if (!q) {
      // Game-First Store Discovery: Display top catalog games without page redundancy
      return gameItems.slice(0, 8);
    }

    const queryTokens = this.tokenize(q);

    const matchedGames = gameItems.filter(item => {
      const itemTitle = item.title.toLowerCase();
      const itemSub = (item.subtitle || '').toLowerCase();
      const itemTags = (item.tags || []).map(t => t.toLowerCase());

      return queryTokens.every(token =>
        itemTitle.includes(token) ||
        itemSub.includes(token) ||
        itemTags.some(t => t.includes(token))
      );
    });

    // Only surface pages if the query tokens match page titles or subtitles
    const matchedNav = this.navCommands.filter(item => {
      const navTitle = item.title.toLowerCase();
      const navSub = (item.subtitle || '').toLowerCase();
      return queryTokens.every(token => navTitle.includes(token) || navSub.includes(token));
    });

    return [...matchedGames, ...matchedNav];
  });

  open(): void {
    this.paletteService.open();
  }

  close(): void {
    this.paletteService.close();
  }

  private resetQuery(): void {
    this.searchQuery.set('');
    this.selectedIndex.set(0);
    if (this.searchInputRef) {
      this.searchInputRef.nativeElement.value = '';
    }
  }

  private focusInput(): void {
    setTimeout(() => {
      if (this.searchInputRef) {
        this.searchInputRef.nativeElement.focus();
      }
    }, 50);
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent): void {
    // Cross-platform normalized Ctrl+K or Cmd+K
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      event.stopPropagation();
      this.paletteService.toggle();
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

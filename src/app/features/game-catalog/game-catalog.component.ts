import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Game } from '../../core/models/game.model';
import { GAMES_DATA } from '../../core/data/tokens';
import { GameCardComponent } from '../../shared/ui/game-card/game-card.component';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SpatialNavDirective } from '../../shared/directives/spatial-nav.directive';

@Component({
  selector: 'app-game-catalog',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    GameCardComponent, 
    LoadingSpinnerComponent, 
    EmptyStateComponent,
    SpatialNavDirective
  ],
  templateUrl: './game-catalog.component.html',
  styleUrls: ['./game-catalog.component.css']
})
export class GameCatalogComponent implements OnInit, OnDestroy {
  private gamesData = inject(GAMES_DATA);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  allGames: Game[] = [];
  filteredGames: Game[] = [];
  featuredGames: Game[] = [];
  availableTags: string[] = [];

  activeHeroIndex = 0;
  hoveredScreenshotUrl: string | null = null;
  searchTerm = '';
  selectedTags: Set<string> = new Set();
  sortBy: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'title-asc' = 'featured';
  loading = true;

  private searchSubject = new Subject<string>();
  private subs = new Subscription();
  private autoRotateInterval: any = null;

  get currentHeroGame(): Game | null {
    if (this.featuredGames.length > 0) {
      return this.featuredGames[this.activeHeroIndex] || this.featuredGames[0];
    }
    return this.allGames[0] || null;
  }

  get currentHeroImage(): string {
    if (this.hoveredScreenshotUrl) {
      return this.hoveredScreenshotUrl;
    }
    const game = this.currentHeroGame;
    if (!game) return '';
    return (game.screenshotUrls && game.screenshotUrls.length > 0) ? game.screenshotUrls[0] : game.coverImageUrl;
  }

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadCatalog();
    this.startAutoRotate();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.stopAutoRotate();
  }

  private setupSearchDebounce(): void {
    this.subs.add(
      this.searchSubject.pipe(
        debounceTime(250),
        distinctUntilChanged()
      ).subscribe(term => {
        this.searchTerm = term;
        this.applyFilters();
        this.updateQueryParams();
      })
    );
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target ? target.value : '');
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  setHeroIndex(index: number): void {
    this.activeHeroIndex = (index + this.featuredGames.length) % this.featuredGames.length;
    this.hoveredScreenshotUrl = null;
  }

  nextHero(): void {
    this.setHeroIndex(this.activeHeroIndex + 1);
  }

  prevHero(): void {
    this.setHeroIndex(this.activeHeroIndex - 1);
  }

  onScreenshotHover(url: string): void {
    this.hoveredScreenshotUrl = url;
  }

  onScreenshotLeave(): void {
    this.hoveredScreenshotUrl = null;
  }

  getTagCount(tag: string): number {
    if (tag === 'All' || tag === 'all') return this.allGames.length;
    return this.allGames.filter(g => g.tags.includes(tag)).length;
  }

  startAutoRotate(): void {
    this.stopAutoRotate();
    this.autoRotateInterval = setInterval(() => {
      if (!this.hoveredScreenshotUrl && this.featuredGames.length > 1) {
        this.nextHero();
      }
    }, 7000);
  }

  stopAutoRotate(): void {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
      this.autoRotateInterval = null;
    }
  }

  loadCatalog(): void {
    this.gamesData.getGames().subscribe(games => {
      this.allGames = games;
      this.featuredGames = games.slice(0, 4); // Select top 4 as spotlight showcase
      this.extractTags(games);

      // Initialize from current route snapshot
      const rawTags = this.route.snapshot.queryParams['tags'] || this.route.snapshot.queryParams['tag'];
      if (rawTags && rawTags !== 'All') {
        const tagList = rawTags.split(',').map((t: string) => t.trim()).filter(Boolean);
        this.selectedTags = new Set(tagList);
      } else {
        this.selectedTags = new Set();
      }

      this.searchTerm = this.route.snapshot.queryParams['search'] || '';
      this.sortBy = this.route.snapshot.queryParams['sort'] || 'featured';
      this.applyFilters();
      this.loading = false;

      // Keep in sync with any external route query param navigation
      this.subs.add(
        this.route.queryParams.subscribe(params => {
          const newRaw = params['tags'] || params['tag'];
          const nextSet = new Set<string>();
          if (newRaw && newRaw !== 'All') {
            newRaw.split(',').map((t: string) => t.trim()).filter(Boolean).forEach((t: string) => nextSet.add(t));
          }
          const newSearch = params['search'] || '';
          const newSort = params['sort'] || 'featured';

          const setsEqual = this.selectedTags.size === nextSet.size && 
            Array.from(this.selectedTags).every(t => nextSet.has(t));

          if (!setsEqual || this.searchTerm !== newSearch || this.sortBy !== newSort) {
            this.selectedTags = nextSet;
            this.searchTerm = newSearch;
            this.sortBy = newSort;
            this.applyFilters();
          }
        })
      );
    });
  }

  private extractTags(games: Game[]): void {
    const tagSet = new Set<string>();
    games.forEach(g => g.tags.forEach(t => tagSet.add(t)));
    this.availableTags = Array.from(tagSet).sort();
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
    this.applyFilters();
    this.updateQueryParams();
  }

  clearTags(): void {
    this.selectedTags.clear();
    this.applyFilters();
    this.updateQueryParams();
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.sortBy = target.value as any;
      this.applyFilters();
      this.updateQueryParams();
    }
  }

  applyFilters(): void {
    let result = [...this.allGames];

    // Filter by tag multi-selection (Union / Match Any)
    if (this.selectedTags.size > 0) {
      result = result.filter(g => g.tags.some(t => this.selectedTags.has(t)));
    }

    // Filter by search keyword
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      result = result.filter(g => 
        g.title.toLowerCase().includes(q) || 
        g.description.toLowerCase().includes(q) ||
        g.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort order
    if (this.sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (this.sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'title-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    this.filteredGames = result;
  }

  private updateQueryParams(): void {
    const params = new URLSearchParams();
    if (this.selectedTags.size > 0) {
      params.set('tags', Array.from(this.selectedTags).join(','));
    }
    if (this.searchTerm.trim()) {
      params.set('search', this.searchTerm.trim());
    }
    if (this.sortBy && this.sortBy !== 'featured') {
      params.set('sort', this.sortBy);
    }
    const query = params.toString();
    const url = query ? `/catalog?${query}` : '/catalog';
    this.location.replaceState(url);
  }

  resetAllFilters(): void {
    this.searchTerm = '';
    this.selectedTags.clear();
    this.sortBy = 'featured';
    this.applyFilters();
    this.updateQueryParams();
  }

  scrollChips(direction: 'left' | 'right'): void {
    const el = document.getElementById('catalog-chips-bar');
    if (el) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
}

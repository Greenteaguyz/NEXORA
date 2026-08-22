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

@Component({
  selector: 'app-game-catalog',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    GameCardComponent, 
    LoadingSpinnerComponent, 
    EmptyStateComponent
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
  selectedTag = 'All';
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
      const initialTag = this.route.snapshot.queryParams['tag'] || 'All';
      const initialSearch = this.route.snapshot.queryParams['search'] || '';
      const initialSort = this.route.snapshot.queryParams['sort'] || 'featured';
      this.selectedTag = initialTag;
      this.searchTerm = initialSearch;
      this.sortBy = initialSort;
      this.applyFilters();
      this.loading = false;

      // Keep in sync with any external route query param navigation
      this.subs.add(
        this.route.queryParams.subscribe(params => {
          const newTag = params['tag'] || 'All';
          const newSearch = params['search'] || '';
          const newSort = params['sort'] || 'featured';

          if (this.selectedTag !== newTag || this.searchTerm !== newSearch || this.sortBy !== newSort) {
            this.selectedTag = newTag;
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
    this.availableTags = ['All', ...Array.from(tagSet).sort()];
  }

  selectTag(tag: string): void {
    if (this.selectedTag === tag) return;
    this.selectedTag = tag;
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

    // Filter by tag
    if (this.selectedTag && this.selectedTag !== 'All') {
      result = result.filter(g => g.tags.includes(this.selectedTag));
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
    if (this.selectedTag && this.selectedTag !== 'All') {
      params.set('tag', this.selectedTag);
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
    this.selectedTag = 'All';
    this.sortBy = 'featured';
    this.applyFilters();
    this.updateQueryParams();
  }
}

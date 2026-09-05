import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Game } from '../../core/models/game.model';
import { GAMES_DATA } from '../../core/data/tokens';
import { GameCardComponent } from '../../shared/ui/game-card/game-card.component';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SpatialNavDirective } from '../../shared/directives/spatial-nav.directive';
import { AmbientSpotlightComponent } from '../../shared/ui/ambient-spotlight/ambient-spotlight.component';
import { AmbientColorExtractorService } from '../../core/services/ambient-color-extractor.service';
import { TranslationService } from '../../core/services/translation.service';

export type CatalogPreset = 'all' | 'top-sellers' | 'discounts' | 'under-10' | 'free';

@Component({
  selector: 'app-game-catalog',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    GameCardComponent, 
    LoadingSpinnerComponent, 
    EmptyStateComponent,
    SpatialNavDirective,
    AmbientSpotlightComponent
  ],
  templateUrl: './game-catalog.component.html',
  styleUrls: ['./game-catalog.component.css']
})
export class GameCatalogComponent implements OnInit, OnDestroy {
  private gamesData = inject(GAMES_DATA);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ambientExtractor = inject(AmbientColorExtractorService);
  private translationService = inject(TranslationService);
  t = this.translationService.t;

  allGames: Game[] = [];
  filteredGames: Game[] = [];
  featuredGames: Game[] = [];
  availableTags: string[] = [];

  activePreset: CatalogPreset = 'all';
  activeHeroIndex = 0;
  hoveredScreenshotUrl: string | null = null;
  searchTerm = '';
  selectedTags: Set<string> = new Set();
  sortBy: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'title-asc' = 'featured';
  loading = true;

  isTransitioning = false;
  private transitionTimer: any = null;

  // Touch & Pointer Drag Tracking
  isDragging = false;
  hasSwiped = false;
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;
  readonly SWIPE_THRESHOLD = 40;
  readonly TAP_THRESHOLD = 6;

  private searchSubject = new Subject<string>();
  private subs = new Subscription();
  private autoRotateInterval: any = null;
  private visibilityHandler: (() => void) | null = null;

  get currentHeroGame(): Game | null {
    if (this.featuredGames.length > 0) {
      return this.featuredGames[this.activeHeroIndex] || this.featuredGames[0];
    }
    return this.allGames[0] || null;
  }

  get currentHeroPalette() {
    return this.ambientExtractor.getPaletteForGame(this.currentHeroGame);
  }

  get selectedTagsSummary(): string {
    return Array.from(this.selectedTags).join(', ');
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
    this.setupVisibilityPause();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.stopAutoRotate();
    this.teardownVisibilityPause();
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
  }

  /** Pause hero rotation when the tab is hidden; resume when visible again. */
  private setupVisibilityPause(): void {
    if (typeof document === 'undefined') return;
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.stopAutoRotate();
      } else {
        this.startAutoRotate();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private teardownVisibilityPause(): void {
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  private setupSearchDebounce(): void {
    this.subs.add(
      this.searchSubject.pipe(
        debounceTime(250),
        distinctUntilChanged()
      ).subscribe(term => {
        this.searchTerm = term;
        this.applyFilters();
        this.syncUrl();
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
    if (this.featuredGames.length === 0) return;
    const nextIndex = (index + this.featuredGames.length) % this.featuredGames.length;
    if (nextIndex === this.activeHeroIndex && !this.hoveredScreenshotUrl) return;

    this.activeHeroIndex = nextIndex;
    this.hoveredScreenshotUrl = null;
    this.triggerSlideTransition();
    this.preloadAdjacentImages();
  }

  nextHero(): void {
    this.setHeroIndex(this.activeHeroIndex + 1);
  }

  prevHero(): void {
    this.setHeroIndex(this.activeHeroIndex - 1);
  }

  private triggerSlideTransition(): void {
    this.isTransitioning = true;
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }
    this.transitionTimer = setTimeout(() => {
      this.isTransitioning = false;
      this.transitionTimer = null;
    }, 350);
  }

  private preloadAdjacentImages(): void {
    if (typeof window === 'undefined' || !this.featuredGames.length) return;
    const nextIdx = (this.activeHeroIndex + 1) % this.featuredGames.length;
    const prevIdx = (this.activeHeroIndex - 1 + this.featuredGames.length) % this.featuredGames.length;
    [this.featuredGames[nextIdx], this.featuredGames[prevIdx]].forEach(g => {
      if (g?.screenshotUrls?.[0]) {
        const img = new Image();
        img.src = g.screenshotUrls[0];
      }
    });
  }

  // Pointer & Touch Handlers for Drag-to-Swipe
  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.currentX = event.clientX;
    this.currentY = event.clientY;
    this.isDragging = true;
    this.hasSwiped = false;
    this.stopAutoRotate();
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;
    this.currentX = event.clientX;
    this.currentY = event.clientY;
    const deltaX = this.currentX - this.startX;
    if (Math.abs(deltaX) > this.TAP_THRESHOLD) {
      this.hasSwiped = true;
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.isDragging) return;
    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;
    this.isDragging = false;

    if (Math.abs(deltaX) >= this.SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        this.nextHero();
      } else {
        this.prevHero();
      }
    }
    this.startAutoRotate();
  }

  onPointerCancel(): void {
    this.isDragging = false;
    this.hasSwiped = false;
    this.startAutoRotate();
  }

  onMediaClick(event: MouseEvent): void {
    if (this.hasSwiped) {
      event.preventDefault();
      event.stopPropagation();
      this.hasSwiped = false;
    }
  }

  onHeroKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.prevHero();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.nextHero();
      event.preventDefault();
    }
  }

  onChipsKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (!target || !target.classList.contains('tag-filter-chip')) return;

    const chips = Array.from(document.querySelectorAll('#catalog-chips-bar .tag-filter-chip')) as HTMLElement[];
    const idx = chips.indexOf(target);
    if (idx === -1) return;

    if (event.key === 'ArrowRight') {
      const nextIdx = Math.min(idx + 1, chips.length - 1);
      chips[nextIdx]?.focus();
      chips[nextIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      const prevIdx = Math.max(idx - 1, 0);
      chips[prevIdx]?.focus();
      chips[prevIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      event.preventDefault();
    } else if (event.key === 'Home') {
      chips[0]?.focus();
      chips[0]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      event.preventDefault();
    } else if (event.key === 'End') {
      chips[chips.length - 1]?.focus();
      chips[chips.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      event.preventDefault();
    }
  }

  onScreenshotHover(url: string): void {
    this.hoveredScreenshotUrl = url;
  }

  onScreenshotLeave(): void {
    this.hoveredScreenshotUrl = null;
  }

  startAutoRotate(): void {
    this.stopAutoRotate();
    // SSR-safe reduced-motion guard: never schedule auto-advance for users
    // who ask for reduced motion (or when no window exists).
    if (typeof window === 'undefined' ||
        (typeof window.matchMedia === 'function' &&
         window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      return;
    }
    this.autoRotateInterval = setInterval(() => {
      if (!this.hoveredScreenshotUrl && !this.isDragging && this.featuredGames.length > 1) {
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

      this.activePreset = (this.route.snapshot.queryParams['preset'] as CatalogPreset) || 'all';
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
          const newPreset = (params['preset'] as CatalogPreset) || 'all';

          const setsEqual = this.selectedTags.size === nextSet.size && 
            Array.from(this.selectedTags).every(t => nextSet.has(t));

          if (!setsEqual || this.searchTerm !== newSearch || this.sortBy !== newSort || this.activePreset !== newPreset) {
            this.selectedTags = nextSet;
            this.searchTerm = newSearch;
            this.sortBy = newSort;
            this.activePreset = newPreset;
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

  setPreset(preset: CatalogPreset): void {
    if (this.activePreset === preset) return;
    this.activePreset = preset;
    this.applyFilters();
    this.syncUrl();
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
    this.applyFilters();
    this.syncUrl();
  }

  clearTags(): void {
    this.selectedTags.clear();
    this.applyFilters();
    this.syncUrl();
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.sortBy = target.value as any;
      this.applyFilters();
      this.syncUrl();
    }
  }

  applyFilters(): void {
    let result = [...this.allGames];

    // Filter by quick preset (Hick's Law)
    if (this.activePreset === 'discounts') {
      result = result.filter(g => !!g.discountPercent && g.discountPercent > 0);
    } else if (this.activePreset === 'under-10') {
      result = result.filter(g => g.price < 10);
    } else if (this.activePreset === 'free') {
      result = result.filter(g => g.price === 0);
    } else if (this.activePreset === 'top-sellers') {
      result = result.filter(g => g.price > 0);
    }

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

  /**
   * Reflect current filters into the URL (replaceUrl: no history spam).
   * Null params are dropped so the URL stays clean. The route.queryParams
   * subscription guards against feedback loops by comparing values before
   * assigning — params written here already match local state, so it no-ops.
   */
  private syncUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.searchTerm.trim() || null,
        tags: this.selectedTags.size > 0 ? Array.from(this.selectedTags).join(',') : null,
        preset: this.activePreset !== 'all' ? this.activePreset : null,
        sort: this.sortBy !== 'featured' ? this.sortBy : null
      },
      queryParamsHandling: '',
      replaceUrl: true
    });
  }

  resetAllFilters(): void {
    this.searchTerm = '';
    this.selectedTags.clear();
    this.activePreset = 'all';
    this.sortBy = 'featured';
    this.applyFilters();
    this.syncUrl();
  }

  scrollChips(direction: 'left' | 'right'): void {
    const el = document.getElementById('catalog-chips-bar');
    if (el) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
}

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
  availableTags: string[] = [];

  searchTerm = '';
  selectedTag = 'All';
  loading = true;

  private searchSubject = new Subject<string>();
  private subs = new Subscription();

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadCatalog();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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

  loadCatalog(): void {
    this.gamesData.getGames().subscribe(games => {
      this.allGames = games;
      this.extractTags(games);

      // Initialize from current route snapshot
      const initialTag = this.route.snapshot.queryParams['tag'] || 'All';
      const initialSearch = this.route.snapshot.queryParams['search'] || '';
      this.selectedTag = initialTag;
      this.searchTerm = initialSearch;
      this.applyFilters();
      this.loading = false;

      // Keep in sync with any external route query param navigation
      this.subs.add(
        this.route.queryParams.subscribe(params => {
          const newTag = params['tag'] || 'All';
          const newSearch = params['search'] || '';

          if (this.selectedTag !== newTag || this.searchTerm !== newSearch) {
            this.selectedTag = newTag;
            this.searchTerm = newSearch;
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

  applyFilters(): void {
    let result = this.allGames;

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
    const query = params.toString();
    const url = query ? `/catalog?${query}` : '/catalog';
    this.location.replaceState(url);
  }

  resetAllFilters(): void {
    this.searchTerm = '';
    this.selectedTag = 'All';
    this.applyFilters();
    this.updateQueryParams();
  }
}

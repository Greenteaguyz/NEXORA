import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Game } from '../../core/models/game.model';
import { LibraryEntry } from '../../core/models/library-entry.model';
import { LIBRARY_DATA, GAMES_DATA } from '../../core/data/tokens';
import { AuthService } from '../../core/auth/auth.service';
import { DownloadService } from '../../core/services/download.service';
import { DownloadButtonComponent } from '../../shared/ui/download-button/download-button.component';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

export interface LibraryDisplayItem {
  entry: LibraryEntry;
  game: Game;
}

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, 
    DownloadButtonComponent, 
    LoadingSpinnerComponent, 
    EmptyStateComponent
  ],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit {
  private libraryData = inject(LIBRARY_DATA);
  private gamesData = inject(GAMES_DATA);
  private auth = inject(AuthService);
  protected downloadService = inject(DownloadService);

  items: LibraryDisplayItem[] = [];
  loading = true;
  searchQuery = '';
  selectedTag = 'all';

  ngOnInit(): void {
    this.loadLibrary();
  }

  loadLibrary(): void {
    const user = this.auth.currentUser();
    if (!user) {
      this.items = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.libraryData.getLibrary(user.id).pipe(
      switchMap(entries => {
        if (!entries || entries.length === 0) {
          return of([]);
        }

        const gameRequests = entries.map(entry =>
          this.gamesData.getGameById(entry.gameId).pipe(
            map(game => game ? { entry, game } : null)
          )
        );

        return forkJoin(gameRequests).pipe(
          map(results => results.filter((item): item is LibraryDisplayItem => item !== null))
        );
      })
    ).subscribe({
      next: (displayItems) => {
        this.items = displayItems;
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.loading = false;
      }
    });
  }

  get availableTags(): string[] {
    const set = new Set<string>();
    for (const item of this.items) {
      for (const tag of item.game.tags) {
        set.add(tag);
      }
    }
    return Array.from(set).sort();
  }

  get filteredItems(): LibraryDisplayItem[] {
    return this.items.filter(item => {
      const matchesSearch = !this.searchQuery.trim() ||
        item.game.title.toLowerCase().includes(this.searchQuery.toLowerCase().trim()) ||
        item.game.tags.some(t => t.toLowerCase().includes(this.searchQuery.toLowerCase().trim()));

      const matchesTag = this.selectedTag === 'all' || item.game.tags.includes(this.selectedTag);

      return matchesSearch && matchesTag;
    });
  }

  formatAcquiredDate(dateString: string): string {
    if (!dateString) return 'Recent';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  onDownload(game: Game): void {
    this.downloadService.downloadGameFile(game);
  }
}

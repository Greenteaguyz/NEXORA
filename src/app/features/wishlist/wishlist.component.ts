import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Game } from '../../core/models/game.model';
import { WishlistEntry } from '../../core/models/wishlist-entry.model';
import { WISHLIST_DATA, GAMES_DATA } from '../../core/data/tokens';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

export interface WishlistDisplayItem {
  entry: WishlistEntry;
  game: Game;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    LoadingSpinnerComponent, 
    EmptyStateComponent
  ],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  private wishlistData = inject(WISHLIST_DATA);
  private gamesData = inject(GAMES_DATA);
  private auth = inject(AuthService);

  items: WishlistDisplayItem[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    const user = this.auth.currentUser();
    if (!user) {
      this.items = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.wishlistData.getWishlist(user.id).pipe(
      switchMap(entries => {
        if (!entries || entries.length === 0) {
          return of([]);
        }

        const requests = entries.map(entry =>
          this.gamesData.getGameById(entry.gameId).pipe(
            map(game => game ? { entry, game } : null)
          )
        );

        return forkJoin(requests).pipe(
          map(results => results.filter((item): item is WishlistDisplayItem => item !== null))
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

  removeFromWishlist(gameId: string, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    const user = this.auth.currentUser();
    if (!user) return;

    this.wishlistData.removeFromWishlist(user.id, gameId).subscribe(() => {
      this.items = this.items.filter(item => item.game.id !== gameId);
    });
  }

  formatAddedDate(dateString: string): string {
    if (!dateString) return 'Recently';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

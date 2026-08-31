import { Component, inject, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Game } from '../../core/models/game.model';
import { LibraryEntry } from '../../core/models/library-entry.model';
import { Order } from '../../core/models/order.model';
import { LIBRARY_DATA, GAMES_DATA, ORDERS_DATA, PAYMENTS_DATA, FinanceWallet } from '../../core/data/tokens';
import { formatUsd } from '../../core/data/payments/payment-logic';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { DownloadService } from '../../core/services/download.service';
import { DownloadButtonComponent } from '../../shared/ui/download-button/download-button.component';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SpatialNavDirective } from '../../shared/directives/spatial-nav.directive';
import { ScrollLockDirective } from '../../shared/directives/scroll-lock.directive';

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
    EmptyStateComponent,
    SpatialNavDirective,
    ScrollLockDirective
  ],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent {
  private libraryData = inject(LIBRARY_DATA);
  private gamesData = inject(GAMES_DATA);
  private ordersData = inject(ORDERS_DATA);
  private paymentsData = inject(PAYMENTS_DATA);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  protected downloadService = inject(DownloadService);

  items: LibraryDisplayItem[] = [];
  loading = true;
  searchQuery = '';
  selectedTags = new Set<string>();

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.searchQuery = '';
      this.selectedTags.clear();
      this.loadLibrary(user);
    });
  }

  loadLibrary(user = this.auth.currentUser()): void {
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

  getTagCount(tag: string): number {
    if (tag === 'all') return this.items.length;
    return this.items.filter(item => item.game.tags.includes(tag)).length;
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
  }

  clearTags(): void {
    this.selectedTags.clear();
  }

  get filteredItems(): LibraryDisplayItem[] {
    return this.items.filter(item => {
      const query = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        item.game.title.toLowerCase().includes(query) ||
        item.game.tags.some(t => t.toLowerCase().includes(query));

      const matchesTag = this.selectedTags.size === 0 || 
        item.game.tags.some(t => this.selectedTags.has(t));

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

  // Soft Deletion Modal State
  gameToRemove: Game | null = null;
  removing = false;

  openRemoveModal(game: Game, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.gameToRemove = game;
  }

  closeRemoveModal(): void {
    if (this.removing) return;
    this.gameToRemove = null;
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.gameToRemove) {
      this.closeRemoveModal();
    }
  }

  confirmRemove(): void {
    if (!this.gameToRemove || this.removing) return;
    const user = this.auth.currentUser();
    if (!user) {
      this.closeRemoveModal();
      return;
    }

    const gameId = this.gameToRemove.id;
    this.removing = true;

    // Paid purchase? Revert the payment before dropping the entitlement,
    // so the not-owned state is legitimate.
    this.ordersData.getOrders(user.id).subscribe(orders => {
      const paidOrder = orders.find(o => o.gameId === gameId && o.status === 'confirmed' && o.price > 0);
      if (!paidOrder) {
        this.proceedRemove(user.id, gameId, null);
        return;
      }
      const walletTender = paidOrder.paymentMethod?.startsWith('NEXORA Store Wallet') ?? false;
      const refund$: Observable<FinanceWallet | null> = walletTender
        ? this.paymentsData.refundWallet(user.id, Math.round(paidOrder.price * 100), paidOrder.id)
        : of(null);
      refund$.subscribe({
        next: () => {
          this.ordersData.revertOrder(paidOrder.id).subscribe({
            next: () => this.proceedRemove(user.id, gameId, paidOrder),
            error: () => this.failRemove()
          });
        },
        error: () => this.failRemove()
      });
    }, () => this.failRemove());
  }

  private proceedRemove(userId: string, gameId: string, refundedOrder: Order | null): void {
    this.libraryData.removeFromLibrary(userId, gameId).subscribe({
      next: () => {
        this.items = this.items.filter(item => item.game.id !== gameId);
        this.removing = false;
        this.gameToRemove = null;
        if (refundedOrder) {
          const walletRefund = refundedOrder.paymentMethod?.startsWith('NEXORA Store Wallet') ?? false;
          this.toast.show({
            type: 'success',
            title: 'Purchase Reverted',
            message: walletRefund
              ? `${formatUsd(refundedOrder.price)} was refunded to your wallet.`
              : 'The purchase was reverted and the game is no longer owned.'
          });
        } else {
          this.toast.show({ type: 'success', title: 'Removed from Library', message: 'The game was removed from your library.' });
        }
      },
      error: () => this.failRemove()
    });
  }

  private failRemove(): void {
    this.removing = false;
    this.gameToRemove = null;
    this.toast.show({ type: 'error', title: 'Removal Failed', message: 'Could not remove this game from your library. Please try again.' });
  }

  removeGame(gameId: string, event?: Event): void {
    const item = this.items.find(i => i.game.id === gameId);
    if (item) {
      this.openRemoveModal(item.game, event);
    }
  }
}

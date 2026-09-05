import { Component, inject, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Game } from '../../core/models/game.model';
import { Order } from '../../core/models/order.model';
import { ORDERS_DATA, GAMES_DATA } from '../../core/data/tokens';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ScrollLockDirective } from '../../shared/directives/scroll-lock.directive';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';

import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';

export interface OrderDisplayItem {
  order: Order;
  game?: Game;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    RouterLink, 
    LoadingSpinnerComponent, 
    EmptyStateComponent,
    ScrollLockDirective,
    SkeletonComponent
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent {
  private ordersData = inject(ORDERS_DATA);
  private gamesData = inject(GAMES_DATA);
  private auth = inject(AuthService);
  private translationService = inject(TranslationService);
  t = this.translationService.t;

  items: OrderDisplayItem[] = [];
  loading = true;
  selectedReceiptOrder: OrderDisplayItem | null = null;
  searchQuery = '';

  get filteredItems(): OrderDisplayItem[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.items;
    return this.items.filter(item => {
      const titleMatch = item.game?.title.toLowerCase().includes(q) ?? false;
      const idMatch = item.order.id.toLowerCase().includes(q);
      const tagMatch = item.game?.tags.some(t => t.toLowerCase().includes(q)) ?? false;
      return titleMatch || idMatch || tagMatch;
    });
  }

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.selectedReceiptOrder = null;
      this.loadOrders(user);
    });
  }

  loadOrders(user = this.auth.currentUser()): void {
    if (!user) {
      this.items = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.ordersData.getOrders(user.id).pipe(
      switchMap(orders => {
        if (!orders || orders.length === 0) {
          return of([]);
        }

        const requests = orders.map(order =>
          this.gamesData.getGameById(order.gameId).pipe(
            map(game => ({ order, game: game || undefined }))
          )
        );

        return forkJoin(requests);
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

  get totalSpent(): number {
    return this.items.reduce((sum, item) => sum + item.order.price, 0);
  }

  formatOrderDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get currentUser() {
    return this.auth.currentUser();
  }

  viewReceipt(item: OrderDisplayItem): void {
    this.selectedReceiptOrder = item;
  }

  closeReceipt(): void {
    this.selectedReceiptOrder = null;
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.selectedReceiptOrder) {
      this.closeReceipt();
    }
  }

  printReceipt(): void {
    if (!this.selectedReceiptOrder) {
      window.print();
      return;
    }
    const previousTitle = document.title;
    document.title = `NEXORA-Receipt-${this.selectedReceiptOrder.order.id}`;
    window.print();
    setTimeout(() => {
      document.title = previousTitle;
    }, 1000);
  }
}

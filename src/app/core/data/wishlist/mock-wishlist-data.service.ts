import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { WishlistEntry } from '../../models/wishlist-entry.model';
import { WishlistDataService } from '../tokens';
import { LocalStoreService } from '../../persistence/local-store.service';
import { SEED_WISHLIST_ENTRIES } from '../seed-data';

@Injectable({
  providedIn: 'root'
})
export class MockWishlistDataService implements WishlistDataService {
  private readonly STORAGE_KEY = 'wishlist_entries';
  private localStore = inject(LocalStoreService);
  private entries: WishlistEntry[] = [];

  constructor() {
    this.initData();
  }

  private initData(): void {
    const saved = this.localStore.getItem<WishlistEntry[]>(this.STORAGE_KEY);
    if (saved && saved.length > 0) {
      this.entries = saved;
    } else {
      this.entries = [...SEED_WISHLIST_ENTRIES];
      this.localStore.setItem(this.STORAGE_KEY, this.entries);
    }
  }

  private persist(): void {
    this.localStore.setItem(this.STORAGE_KEY, this.entries);
  }

  getWishlist(userId: string): Observable<WishlistEntry[]> {
    const list = this.entries.filter(e => e.userId === userId);
    return of(list);
  }

  addToWishlist(userId: string, gameId: string): Observable<WishlistEntry> {
    const existing = this.entries.find(e => e.userId === userId && e.gameId === gameId);
    if (existing) {
      return of(existing);
    }

    const newEntry: WishlistEntry = {
      id: 'wsh_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      userId,
      gameId,
      addedAt: new Date().toISOString()
    };

    this.entries.unshift(newEntry);
    this.persist();
    return of(newEntry);
  }

  removeFromWishlist(userId: string, gameId: string): Observable<void> {
    this.entries = this.entries.filter(e => !(e.userId === userId && e.gameId === gameId));
    this.persist();
    return of(void 0);
  }

  isWishlisted(userId: string, gameId: string): Observable<boolean> {
    const exists = this.entries.some(e => e.userId === userId && e.gameId === gameId);
    return of(exists);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { LibraryEntry } from '../../models/library-entry.model';
import { LibraryDataService } from '../tokens';
import { LocalStoreService } from '../../persistence/local-store.service';
import { SEED_LIBRARY_ENTRIES } from '../seed-data';

@Injectable({
  providedIn: 'root'
})
export class MockLibraryDataService implements LibraryDataService {
  private readonly STORAGE_KEY = 'library_entries';
  private localStore = inject(LocalStoreService);
  private entries: LibraryEntry[] = [];

  constructor() {
    this.initData();
  }

  private initData(): void {
    const saved = this.localStore.getItem<LibraryEntry[]>(this.STORAGE_KEY);
    if (saved && saved.length > 0) {
      this.entries = saved;
    } else {
      this.entries = [...SEED_LIBRARY_ENTRIES];
      this.localStore.setItem(this.STORAGE_KEY, this.entries);
    }
  }

  private persist(): void {
    this.localStore.setItem(this.STORAGE_KEY, this.entries);
  }

  getLibrary(userId: string): Observable<LibraryEntry[]> {
    const userEntries = this.entries.filter(e => e.userId === userId);
    return of(userEntries);
  }

  addToLibrary(userId: string, gameId: string, orderId?: string): Observable<LibraryEntry> {
    const existing = this.entries.find(e => e.userId === userId && e.gameId === gameId);
    if (existing) {
      return of(existing);
    }

    const newEntry: LibraryEntry = {
      id: 'lib_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      userId,
      gameId,
      acquiredAt: new Date().toISOString(),
      orderId
    };

    this.entries.unshift(newEntry);
    this.persist();
    return of(newEntry);
  }

  isOwned(userId: string, gameId: string): Observable<boolean> {
    const owned = this.entries.some(e => e.userId === userId && e.gameId === gameId);
    return of(owned);
  }
}

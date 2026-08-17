import { Injectable, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Game, CreateGameDto, UpdateGameDto } from '../../models/game.model';
import { GamesDataService, GameFilters } from '../tokens';
import { LocalStoreService } from '../../persistence/local-store.service';
import { SEED_GAMES } from '../seed-data';

@Injectable({
  providedIn: 'root'
})
export class MockGamesDataService implements GamesDataService {
  private readonly STORAGE_KEY = 'games_list';
  private localStore = inject(LocalStoreService);
  private games: Game[] = [];

  constructor() {
    this.initData();
  }

  private initData(): void {
    const saved = this.localStore.getItem<Game[]>(this.STORAGE_KEY);
    if (saved && saved.length > 0) {
      this.games = saved;
    } else {
      this.games = [...SEED_GAMES];
      this.localStore.setItem(this.STORAGE_KEY, this.games);
    }
  }

  private persist(): void {
    this.localStore.setItem(this.STORAGE_KEY, this.games);
  }

  getGames(filters?: GameFilters): Observable<Game[]> {
    let result = this.games.filter(g => !g.deletedAt);

    if (filters?.tag) {
      const tagLower = filters.tag.toLowerCase();
      result = result.filter(g => g.tags.some(t => t.toLowerCase() === tagLower));
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase().trim();
      result = result.filter(g => g.title.toLowerCase().includes(searchLower));
    }

    return of(result);
  }

  getGameById(id: string): Observable<Game | undefined> {
    const game = this.games.find(g => g.id === id);
    return of(game);
  }

  getGamesByOwnerId(ownerId: string): Observable<Game[]> {
    const result = this.games.filter(g => g.ownerId === ownerId);
    return of(result);
  }

  createGame(dto: CreateGameDto, ownerId: string): Observable<Game> {
    const newGame: Game = {
      ...dto,
      id: 'game_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.games.unshift(newGame);
    this.persist();
    return of(newGame).pipe(delay(100));
  }

  updateGame(id: string, dto: UpdateGameDto): Observable<Game> {
    const index = this.games.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error(`Game with id ${id} not found`);
    }
    const updated: Game = {
      ...this.games[index],
      ...dto,
      updatedAt: new Date().toISOString()
    };
    this.games[index] = updated;
    this.persist();
    return of(updated).pipe(delay(100));
  }

  deleteGame(id: string): Observable<void> {
    const index = this.games.findIndex(g => g.id === id);
    if (index !== -1) {
      this.games[index] = {
        ...this.games[index],
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.persist();
    }
    return of(void 0).pipe(delay(80));
  }

  resetToDefaultSeed(): Observable<void> {
    this.games = [...SEED_GAMES];
    this.persist();
    return of(void 0).pipe(delay(100));
  }
}

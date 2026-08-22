import { TestBed } from '@angular/core/testing';
import { MockGamesDataService } from '../data/games/mock-games-data.service';
import { LocalStoreService } from '../persistence/local-store.service';
import { firstValueFrom } from 'rxjs';

describe('MockGamesDataService — Catalog, Search, Filtering & Creator CRUD Suite', () => {
  let service: MockGamesDataService;
  let localStore: LocalStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockGamesDataService, LocalStoreService]
    });
    localStore = TestBed.inject(LocalStoreService);
    localStore.clear();
    service = TestBed.inject(MockGamesDataService);
  });

  afterEach(() => {
    localStore.clear();
  });

  it('1. should load all initial seed games with full media and metadata', async () => {
    const games = await firstValueFrom(service.getGames());
    expect(games.length).toBeGreaterThanOrEqual(8);

    for (const game of games) {
      expect(game.id).toBeTruthy();
      expect(game.title).toBeTruthy();
      expect(game.coverImageUrl).toBeTruthy();
      expect(Array.isArray(game.screenshotUrls)).toBeTrue();
      expect(game.screenshotUrls.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(game.tags)).toBeTrue();
      expect(typeof game.price).toBe('number');
    }
  });

  it('2. should filter games by genre or tag accurately', async () => {
    const actionGames = await firstValueFrom(service.getGames({ tag: 'Action' }));
    expect(actionGames.length).toBeGreaterThan(0);
    for (const game of actionGames) {
      const hasTag = game.tags.some(t => t.toLowerCase() === 'action');
      expect(hasTag).toBeTrue();
    }
  });

  it('3. should search games by title or description keyword', async () => {
    const searchResults = await firstValueFrom(service.getGames({ search: 'Cyber' }));
    expect(searchResults.length).toBeGreaterThan(0);
    for (const game of searchResults) {
      const matchesTitle = game.title.toLowerCase().includes('cyber');
      const matchesDesc = game.description.toLowerCase().includes('cyber');
      expect(matchesTitle || matchesDesc).toBeTrue();
    }
  });

  it('4. should retrieve a specific game by ID', async () => {
    const game = await firstValueFrom(service.getGameById('game_001'));
    expect(game).toBeDefined();
    expect(game?.id).toBe('game_001');
    expect(game?.title).toBeTruthy();
  });

  it('5. should allow creators to publish a new game listing', async () => {
    const newGame = await firstValueFrom(service.createGame('user_creator_01', {
      title: 'Neon Odyssey 2099',
      description: 'A cutting-edge indie space simulation.',
      price: 19.99,
      tags: ['Sci-Fi', 'Simulation', 'Space'],
      coverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      screenshotUrls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200']
    }));

    expect(newGame.id).toBeTruthy();
    expect(newGame.creatorId).toBe('user_creator_01');
    expect(newGame.title).toBe('Neon Odyssey 2099');

    // Verify it appears in public catalog
    const allGames = await firstValueFrom(service.getGames());
    const found = allGames.find(g => g.id === newGame.id);
    expect(found).toBeDefined();
  });

  it('6. should allow creators to update existing game details', async () => {
    const updated = await firstValueFrom(service.updateGame('game_001', {
      title: 'Aetheria Chronicles: Definitive Edition',
      price: 24.99
    }));

    expect(updated.title).toBe('Aetheria Chronicles: Definitive Edition');
    expect(updated.price).toBe(24.99);

    const fetched = await firstValueFrom(service.getGameById('game_001'));
    expect(fetched?.title).toBe('Aetheria Chronicles: Definitive Edition');
  });

  it('7. should soft-delete / archive a game listing', async () => {
    await firstValueFrom(service.deleteGame('game_002'));
    
    // Soft-deleted games should not be returned in public catalog queries
    const activeGames = await firstValueFrom(service.getGames());
    const deleted = activeGames.find(g => g.id === 'game_002');
    expect(deleted).toBeUndefined();
  });
});

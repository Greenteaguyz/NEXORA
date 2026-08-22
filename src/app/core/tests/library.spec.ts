import { TestBed } from '@angular/core/testing';
import { MockLibraryDataService } from '../data/library/mock-library-data.service';
import { LocalStoreService } from '../persistence/local-store.service';
import { firstValueFrom } from 'rxjs';

describe('MockLibraryDataService — Game Ownership & Library Suite', () => {
  let service: MockLibraryDataService;
  let localStore: LocalStoreService;
  const testUserId = 'user_gamer_01';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockLibraryDataService, LocalStoreService]
    });
    localStore = TestBed.inject(LocalStoreService);
    localStore.clear();
    service = TestBed.inject(MockLibraryDataService);
  });

  afterEach(() => {
    localStore.clear();
  });

  it('1. should add a purchased game to library and verify ownership', async () => {
    const entry = await firstValueFrom(service.addToLibrary(testUserId, 'game_001', 'ord_test123'));
    expect(entry).toBeDefined();
    expect(entry.gameId).toBe('game_001');
    expect(entry.orderId).toBe('ord_test123');

    const owned = await firstValueFrom(service.isOwned(testUserId, 'game_001'));
    expect(owned).toBeTrue();
  });

  it('2. should prevent duplicate library entries (idempotent ownership)', async () => {
    await firstValueFrom(service.addToLibrary(testUserId, 'game_002'));
    await firstValueFrom(service.addToLibrary(testUserId, 'game_002'));

    const library = await firstValueFrom(service.getLibrary(testUserId));
    const matching = library.filter(e => e.gameId === 'game_002');
    expect(matching.length).toBe(1);
  });

  it('3. should accurately reflect unowned games', async () => {
    const owned = await firstValueFrom(service.isOwned(testUserId, 'unowned_game_999'));
    expect(owned).toBeFalse();
  });

  it('4. should retrieve complete library list for a user', async () => {
    await firstValueFrom(service.addToLibrary(testUserId, 'game_001'));
    await firstValueFrom(service.addToLibrary(testUserId, 'game_003'));

    const list = await firstValueFrom(service.getLibrary(testUserId));
    expect(list.length).toBeGreaterThanOrEqual(2);
  });
});

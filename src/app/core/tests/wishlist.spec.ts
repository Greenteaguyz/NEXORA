import { TestBed } from '@angular/core/testing';
import { MockWishlistDataService } from '../data/wishlist/mock-wishlist-data.service';
import { LocalStoreService } from '../persistence/local-store.service';
import { firstValueFrom } from 'rxjs';

describe('MockWishlistDataService — Wishlist Management Suite', () => {
  let service: MockWishlistDataService;
  let localStore: LocalStoreService;
  const testUserId = 'user_gamer_01';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockWishlistDataService, LocalStoreService]
    });
    localStore = TestBed.inject(LocalStoreService);
    localStore.clear();
    service = TestBed.inject(MockWishlistDataService);
  });

  afterEach(() => {
    localStore.clear();
  });

  it('1. should add a game to wishlist and verify isWishlisted state', async () => {
    const entry = await firstValueFrom(service.addToWishlist(testUserId, 'game_001'));
    expect(entry).toBeDefined();
    expect(entry.gameId).toBe('game_001');
    expect(entry.userId).toBe(testUserId);

    const isSaved = await firstValueFrom(service.isWishlisted(testUserId, 'game_001'));
    expect(isSaved).toBeTrue();
  });

  it('2. should prevent duplicate wishlist entries (idempotent)', async () => {
    await firstValueFrom(service.addToWishlist(testUserId, 'game_003'));
    await firstValueFrom(service.addToWishlist(testUserId, 'game_003'));

    const list = await firstValueFrom(service.getWishlist(testUserId));
    const matching = list.filter(item => item.gameId === 'game_003');
    expect(matching.length).toBe(1);
  });

  it('3. should remove a game from wishlist', async () => {
    await firstValueFrom(service.addToWishlist(testUserId, 'game_004'));
    let isSaved = await firstValueFrom(service.isWishlisted(testUserId, 'game_004'));
    expect(isSaved).toBeTrue();

    await firstValueFrom(service.removeFromWishlist(testUserId, 'game_004'));
    isSaved = await firstValueFrom(service.isWishlisted(testUserId, 'game_004'));
    expect(isSaved).toBeFalse();
  });

  it('4. should return accurate wishlist list for a user', async () => {
    await firstValueFrom(service.addToWishlist(testUserId, 'game_001'));
    await firstValueFrom(service.addToWishlist(testUserId, 'game_002'));

    const list = await firstValueFrom(service.getWishlist(testUserId));
    expect(list.length).toBeGreaterThanOrEqual(2);
  });
});

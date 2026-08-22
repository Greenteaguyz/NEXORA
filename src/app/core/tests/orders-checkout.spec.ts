import { TestBed } from '@angular/core/testing';
import { MockOrdersDataService } from '../data/orders/mock-orders-data.service';
import { LocalStoreService } from '../persistence/local-store.service';
import { firstValueFrom } from 'rxjs';

describe('MockOrdersDataService — Checkout, Purchases & Transaction History Suite', () => {
  let service: MockOrdersDataService;
  let localStore: LocalStoreService;
  const testUserId = 'user_gamer_01';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockOrdersDataService, LocalStoreService]
    });
    localStore = TestBed.inject(LocalStoreService);
    localStore.clear();
    service = TestBed.inject(MockOrdersDataService);
  });

  afterEach(() => {
    localStore.clear();
  });

  it('1. should create a paid game order with confirmation status and ID', async () => {
    const order = await firstValueFrom(service.createOrder(
      testUserId,
      'game_001',
      14.99,
      'Steam Wallet'
    ));

    expect(order).toBeDefined();
    expect(order.id.startsWith('ord_')).toBeTrue();
    expect(order.userId).toBe(testUserId);
    expect(order.gameId).toBe('game_001');
    expect(order.price).toBe(14.99);
    expect(order.paymentMethod).toBe('Steam Wallet');
    expect(order.status).toBe('confirmed');
    expect(order.createdAt).toBeTruthy();
  });

  it('2. should create a Free-to-Play game claim order ($0.00)', async () => {
    const order = await firstValueFrom(service.createOrder(
      testUserId,
      'game_004',
      0,
      'Free Acquisition'
    ));

    expect(order.price).toBe(0);
    expect(order.status).toBe('confirmed');
  });

  it('3. should retrieve complete purchase history for a user', async () => {
    await firstValueFrom(service.createOrder(testUserId, 'game_001', 9.99));
    await firstValueFrom(service.createOrder(testUserId, 'game_002', 19.99));

    const orders = await firstValueFrom(service.getOrders(testUserId));
    expect(orders.length).toBeGreaterThanOrEqual(2);

    const totalSpent = orders.reduce((sum, o) => sum + o.price, 0);
    expect(totalSpent).toBeGreaterThan(0);
  });
});

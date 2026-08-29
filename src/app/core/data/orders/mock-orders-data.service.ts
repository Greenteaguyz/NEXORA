import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Order } from '../../models/order.model';
import { OrdersDataService } from '../tokens';
import { LocalStoreService } from '../../persistence/local-store.service';
import { SEED_ORDERS } from '../seed-data';

@Injectable({
  providedIn: 'root'
})
export class MockOrdersDataService implements OrdersDataService {
  private readonly STORAGE_KEY = 'orders_list';
  private localStore = inject(LocalStoreService);
  private orders: Order[] = [];

  constructor() {
    this.initData();
  }

  private initData(): void {
    const saved = this.localStore.getItem<Order[]>(this.STORAGE_KEY);
    if (saved && saved.length > 0) {
      const seedMap = new Map(SEED_ORDERS.map(s => [s.id, s]));
      this.orders = saved.map(o => {
        if (o.createdAt && o.createdAt.startsWith('2024')) {
          const seed = seedMap.get(o.id);
          return seed ? { ...o, createdAt: seed.createdAt } : { ...o, createdAt: new Date().toISOString() };
        }
        return o;
      });
      this.localStore.setItem(this.STORAGE_KEY, this.orders);
    } else {
      this.orders = [...SEED_ORDERS];
      this.localStore.setItem(this.STORAGE_KEY, this.orders);
    }
  }

  private persist(): void {
    this.localStore.setItem(this.STORAGE_KEY, this.orders);
  }

  createOrder(userId: string, gameId: string, price: number, paymentMethod?: string): Observable<Order> {
    const newOrder: Order = {
      id: 'ord_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      userId,
      gameId,
      price,
      paymentMethod: paymentMethod || 'Credit Card (Visa •••• 4242)',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    this.orders.unshift(newOrder);
    this.persist();
    return of(newOrder);
  }

  getOrders(userId: string): Observable<Order[]> {
    const userOrders = this.orders.filter(o => o.userId === userId);
    return of(userOrders);
  }

  getAllOrders(): Observable<Order[]> {
    return of([...this.orders]);
  }
}


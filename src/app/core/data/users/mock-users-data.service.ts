import { Injectable, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { User } from '../../models/user.model';
import { UsersDataService } from '../tokens';
import { LocalStoreService } from '../../persistence/local-store.service';
import { SEED_USERS } from '../seed-data';

@Injectable({
  providedIn: 'root'
})
export class MockUsersDataService implements UsersDataService {
  private readonly STORAGE_KEY = 'users_list';
  private localStore = inject(LocalStoreService);
  private users: User[] = [];

  constructor() {
    this.initData();
  }

  private initData(): void {
    const saved = this.localStore.getItem<User[]>(this.STORAGE_KEY);
    if (saved && saved.length > 0) {
      this.users = saved;
    } else {
      this.users = [...SEED_USERS];
      this.localStore.setItem(this.STORAGE_KEY, this.users);
    }
  }

  private persist(): void {
    this.localStore.setItem(this.STORAGE_KEY, this.users);
  }

  getUser(id: string): Observable<User | undefined> {
    const user = this.users.find(u => u.id === id);
    return of(user);
  }

  getUserByEmail(email: string): Observable<User | undefined> {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return of(user);
  }

  updateUser(id: string, partial: Partial<User>): Observable<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    const updated: User = {
      ...this.users[index],
      ...partial
    };
    this.users[index] = updated;
    this.persist();
    return of(updated).pipe(delay(80));
  }
}

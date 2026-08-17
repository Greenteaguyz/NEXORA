import { Injectable, inject } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { LocalStoreService } from '../persistence/local-store.service';
import { SEED_USERS } from '../data/seed-data';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterDto {
  email: string;
  displayName: string;
  isCreator: boolean;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthMockService {
  private readonly STORAGE_KEY = 'auth_users';
  private localStore = inject(LocalStoreService);
  private users: User[] = [];

  constructor() {
    this.initUsers();
  }

  private initUsers(): void {
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

  authenticate(credentials: LoginCredentials): Observable<User> {
    const emailLower = credentials.email.toLowerCase().trim();
    const user = this.users.find(u => u.email.toLowerCase() === emailLower);

    if (user) {
      return of(user).pipe(delay(120));
    }

    // If it's a new email during mock login, create a default buyer
    const newUser: User = {
      id: 'usr_' + Date.now().toString(36),
      email: emailLower,
      displayName: emailLower.split('@')[0],
      roles: ['buyer'],
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${emailLower}`,
      bio: 'NEXORA Member',
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    this.persist();
    return of(newUser).pipe(delay(120));
  }

  register(dto: RegisterDto): Observable<User> {
    const emailLower = dto.email.toLowerCase().trim();
    const existing = this.users.find(u => u.email.toLowerCase() === emailLower);
    if (existing) {
      return throwError(() => new Error('An account with this email already exists'));
    }

    const roles: UserRole[] = dto.isCreator ? ['buyer', 'creator'] : ['buyer'];
    const newUser: User = {
      id: 'usr_' + Date.now().toString(36),
      email: emailLower,
      displayName: dto.displayName.trim() || emailLower.split('@')[0],
      roles,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${emailLower}`,
      bio: dto.isCreator ? 'Indie Game Creator on NEXORA' : 'Gamer on NEXORA',
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.persist();
    return of(newUser).pipe(delay(150));
  }

  socialSignIn(provider: 'google' | 'apple'): Observable<User> {
    const mockEmail = `${provider}.gamer@nexora.io`;
    return this.authenticate({ email: mockEmail });
  }

  updateUserProfile(userId: string, partial: Partial<User>): Observable<User> {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) {
      return throwError(() => new Error('User not found'));
    }
    const updated = { ...this.users[index], ...partial };
    this.users[index] = updated;
    this.persist();
    return of(updated).pipe(delay(80));
  }
}

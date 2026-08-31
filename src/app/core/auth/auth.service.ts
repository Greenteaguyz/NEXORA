import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { LocalStoreService } from '../persistence/local-store.service';
import { AuthMockService, LoginCredentials, RegisterDto, DEFAULT_SEED_PASSWORD } from './auth.mock';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_KEY = 'auth_session_user';
  private localStore = inject(LocalStoreService);
  private authMock = inject(AuthMockService);
  private router = inject(Router);

  // Reactive State Signals
  readonly currentUser = signal<User | null>(this.loadSessionUser());
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isCreator = computed(() => this.currentUser()?.roles.includes('creator') ?? false);
  readonly isBuyer = computed(() => this.currentUser()?.roles.includes('buyer') ?? false);

  private loadSessionUser(): User | null {
    return this.localStore.getItem<User>(this.SESSION_KEY);
  }

  private setSessionUser(user: User | null): void {
    this.currentUser.set(user);
    if (user) {
      this.localStore.setItem(this.SESSION_KEY, user);
    } else {
      this.localStore.removeItem(this.SESSION_KEY);
    }
  }

  login(credentials: LoginCredentials): Observable<User> {
    return this.authMock.authenticate(credentials).pipe(
      tap(user => this.setSessionUser(user))
    );
  }

  register(dto: RegisterDto): Observable<User> {
    return this.authMock.register(dto).pipe(
      tap(user => this.setSessionUser(user))
    );
  }

  socialSignIn(provider: 'google' | 'apple'): Observable<User> {
    return this.authMock.socialSignIn(provider).pipe(
      tap(user => this.setSessionUser(user))
    );
  }

  logout(): void {
    this.setSessionUser(null);
    this.router.navigate(['/catalog']);
  }

  toggleCreatorRole(): Observable<User> {
    const user = this.currentUser();
    if (!user) {
      throw new Error('No active user to toggle role');
    }

    const hasCreator = user.roles.includes('creator');
    const newRoles = hasCreator 
      ? user.roles.filter(r => r !== 'creator')
      : [...user.roles, 'creator' as const];

    return this.authMock.updateUserProfile(user.id, { roles: newRoles }).pipe(
      tap(updated => this.setSessionUser(updated))
    );
  }

  updateProfile(partial: Partial<User>): Observable<User> {
    const user = this.currentUser();
    if (!user) {
      throw new Error('No active user');
    }

    return this.authMock.updateUserProfile(user.id, partial).pipe(
      tap(updated => this.setSessionUser(updated))
    );
  }

  hasPassword(): boolean {
    return true;
  }

  changePassword(current: string, next: string): Observable<User> {
    const user = this.currentUser();
    if (!user) {
      return throwError(() => new Error('No active user to change password'));
    }
    return this.authMock.changePassword(user.id, current, next);
  }

  switchDemoUser(email: string): Observable<User> {
    return this.login({ email, password: DEFAULT_SEED_PASSWORD });
  }
}

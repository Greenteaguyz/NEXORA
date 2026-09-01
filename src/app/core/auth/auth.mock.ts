import { Injectable, inject } from '@angular/core';
import { Observable, of, delay, throwError, from, switchMap } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { LocalStoreService } from '../persistence/local-store.service';
import { SEED_USERS } from '../data/seed-data';
import {
  PASSWORD_MIN_LENGTH,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  ERR_INCORRECT_PASSWORD,
  ERR_LOCKED_OUT,
  generateSalt,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  getLockoutRemainingMs,
  LockoutState
} from './password-logic';

export const DEFAULT_SEED_PASSWORD = 'password123';
export const SEED_SALT = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
export const SEED_HASH = 'accbf01031d30e38aaaa2e9e5a2f6df00d62a2e3912c33ad393495d18ca97ee2';

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

export interface AuthCredentialRecord {
  salt: string;
  hash: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthMockService {
  private readonly STORAGE_KEY = 'auth_users';
  private readonly CREDENTIALS_KEY = 'auth_credentials';
  private localStore = inject(LocalStoreService);
  private users: User[] = [];
  private credentials: Record<string, AuthCredentialRecord> = {};
  private lockoutStates = new Map<string, LockoutState>();

  constructor() {
    this.initUsers();
    this.initCredentials();
  }

  private initUsers(): void {
    const saved = this.localStore.getItem<User[]>(this.STORAGE_KEY);
    if (saved && saved.length > 0) {
      const seedMap = new Map(SEED_USERS.map(s => [s.id, s]));
      this.users = saved.map(u => {
        if (u.createdAt && u.createdAt.startsWith('2024')) {
          const seed = seedMap.get(u.id);
          return seed ? { ...u, createdAt: seed.createdAt } : { ...u, createdAt: new Date().toISOString() };
        }
        return u;
      });
      this.localStore.setItem(this.STORAGE_KEY, this.users);
    } else {
      this.users = [...SEED_USERS];
      this.localStore.setItem(this.STORAGE_KEY, this.users);
    }
  }

  private initCredentials(): void {
    const saved = this.localStore.getItem<Record<string, AuthCredentialRecord>>(this.CREDENTIALS_KEY);
    this.credentials = saved ? { ...saved } : {};

    // Universal password guarantee: All seed users have credentials provisioned
    let updated = false;
    SEED_USERS.forEach(u => {
      if (!this.credentials[u.id] || (this.credentials[u.id].salt === SEED_SALT && this.credentials[u.id].hash !== SEED_HASH)) {
        this.credentials[u.id] = {
          salt: SEED_SALT,
          hash: SEED_HASH,
          updatedAt: new Date().toISOString()
        };
        updated = true;
      }
    });
    if (updated) {
      this.persistCredentials();
    }
  }

  private persist(): void {
    this.localStore.setItem(this.STORAGE_KEY, this.users);
  }

  private persistCredentials(): void {
    this.localStore.setItem(this.CREDENTIALS_KEY, this.credentials);
  }

  hasPassword(userId: string): boolean {
    return !!this.credentials[userId];
  }

  getLockoutState(userId: string): LockoutState | undefined {
    return this.lockoutStates.get(userId);
  }

  authenticate(credentials: LoginCredentials): Observable<User> {
    const emailLower = credentials.email.toLowerCase().trim();
    const user = this.users.find(u => u.email.toLowerCase() === emailLower);

    if (user) {
      const cred = this.credentials[user.id];
      // Universal password guarantee: Password is required and verified for every account
      if (!credentials.password || !cred) {
        return throwError(() => new Error('Incorrect email or password'));
      }
      return from(verifyPassword(credentials.password, cred.salt, cred.hash)).pipe(
        switchMap(isValid => {
          if (isValid) {
            return of(user).pipe(delay(120));
          }
          return throwError(() => new Error('Incorrect email or password'));
        })
      );
    }

    return throwError(() => new Error('Incorrect email or password'));
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

    if (dto.password && dto.password.trim().length > 0) {
      const strength = validatePasswordStrength(dto.password);
      if (!strength.valid) {
        return throwError(() => new Error(strength.errors.join('. ')));
      }
      return from((async () => {
        const salt = generateSalt();
        const hash = await hashPassword(dto.password!, salt);
        this.credentials[newUser.id] = {
          salt,
          hash,
          updatedAt: new Date().toISOString()
        };
        this.persistCredentials();
        this.users.push(newUser);
        this.persist();
        return newUser;
      })()).pipe(delay(150));
    }

    this.users.push(newUser);
    this.persist();
    return of(newUser).pipe(delay(150));
  }

  changePassword(userId: string, currentPw: string, newPw: string): Observable<User> {
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      return throwError(() => new Error('User not found'));
    }

    return from((async () => {
      const now = Date.now();
      let state = this.lockoutStates.get(userId);
      if (state && state.lockedUntil && now >= state.lockedUntil) {
        state.failedAttempts = 0;
        state.lockedUntil = null;
      }

      const remainingMs = getLockoutRemainingMs(state, now);
      if (remainingMs > 0) {
        const err: any = new Error(`Account locked due to too many failed attempts. Try again in ${Math.ceil(remainingMs / 1000)}s.`);
        err.code = ERR_LOCKED_OUT;
        err.remainingMs = remainingMs;
        throw err;
      }

      if (!currentPw || currentPw.trim().length === 0) {
        const err: any = new Error('Current password is required');
        err.code = 'ERR_CURRENT_REQUIRED';
        throw err;
      }

      if (currentPw.trim() === newPw.trim()) {
        const err: any = new Error('New password cannot be the same as your current password');
        err.code = 'ERR_SAME_PASSWORD';
        throw err;
      }

      const existing = this.credentials[userId];
      if (existing) {
        const isValid = await verifyPassword(currentPw, existing.salt, existing.hash);
        if (!isValid) {
          if (!state) {
            state = { failedAttempts: 0, lockedUntil: null };
            this.lockoutStates.set(userId, state);
          }
          state.failedAttempts++;
          if (state.failedAttempts >= MAX_FAILED_ATTEMPTS) {
            state.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
            const err: any = new Error(`Account locked due to too many failed attempts. Try again in ${Math.ceil(LOCKOUT_DURATION_MS / 1000)}s.`);
            err.code = ERR_LOCKED_OUT;
            err.remainingMs = LOCKOUT_DURATION_MS;
            throw err;
          } else {
            const attemptsRemaining = MAX_FAILED_ATTEMPTS - state.failedAttempts;
            const err: any = new Error(`Incorrect current password. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.`);
            err.code = ERR_INCORRECT_PASSWORD;
            err.attemptsRemaining = attemptsRemaining;
            throw err;
          }
        }
      }

      // Validate new password strength server-shape
      const validation = validatePasswordStrength(newPw);
      if (!validation.valid) {
        const err: any = new Error(validation.errors.join('. '));
        err.code = 'ERR_WEAK_PASSWORD';
        err.validationErrors = validation.errors;
        throw err;
      }

      // Salt and hash new password
      const salt = generateSalt();
      const hash = await hashPassword(newPw, salt);
      this.credentials[userId] = {
        salt,
        hash,
        updatedAt: new Date().toISOString()
      };
      this.persistCredentials();

      // Reset lockout counter on success
      this.lockoutStates.delete(userId);
      return user;
    })()).pipe(delay(150));
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

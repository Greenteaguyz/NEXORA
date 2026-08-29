import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { LocalStoreService } from '../persistence/local-store.service';
import { AuthMockService } from '../auth/auth.mock';
import { sanitizeReturnUrl } from '../auth/return-url.util';
import { firstValueFrom } from 'rxjs';

describe('AuthService — Complete Authentication & Session Suite', () => {
  let service: AuthService;
  let localStore: LocalStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, LocalStoreService, AuthMockService]
    });
    localStore = TestBed.inject(LocalStoreService);
    localStore.clear();
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStore.clear();
  });

  it('1. should initialize with default session or null', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.isCreator()).toBeFalse();
  });

  it('2. should authenticate user with demo credentials and set reactive signals', async () => {
    const user = await firstValueFrom(service.login({ email: 'gamer@nexora.io', password: 'password123' }));
    
    expect(user).toBeDefined();
    expect(user.email).toBe('gamer@nexora.io');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()?.id).toBe(user.id);
  });

  it('3. should reject invalid login credentials', async () => {
    try {
      await firstValueFrom(service.login({ email: 'nonexistent@nexora.io', password: 'wrong' }));
      fail('Expected login to fail');
    } catch (err: any) {
      expect(err).toBeDefined();
      expect(service.isAuthenticated()).toBeFalse();
    }
  });

  it('4. should register a new creator user with creator role', async () => {
    const user = await firstValueFrom(service.register({
      username: 'TestDevStudio',
      email: 'dev@studio.io',
      password: 'SecurePassword123',
      role: 'creator'
    }));

    expect(user.roles).toContain('creator');
    expect(service.isCreator()).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('5. should register a standard gamer with buyer role', async () => {
    const user = await firstValueFrom(service.register({
      username: 'CasualPlayer',
      email: 'player@games.io',
      password: 'SecurePassword123',
      role: 'buyer'
    }));

    expect(user.roles).toContain('buyer');
    expect(service.isBuyer()).toBeTrue();
  });

  it('6. should switch between demo personas seamlessly', async () => {
    // Switch to Creator
    const creator = await firstValueFrom(service.switchDemoUser('creator@nexora.io'));
    expect(creator.roles).toContain('creator');
    expect(service.isCreator()).toBeTrue();

    // Switch to Admin
    const admin = await firstValueFrom(service.switchDemoUser('admin@nexora.io'));
    expect(admin.roles).toContain('admin');
  });

  it('7. should toggle creator role on current profile', async () => {
    await firstValueFrom(service.switchDemoUser('gamer@nexora.io'));
    expect(service.isCreator()).toBeFalse();

    const upgraded = await firstValueFrom(service.toggleCreatorRole());
    expect(upgraded.roles).toContain('creator');
    expect(service.isCreator()).toBeTrue();
  });

  it('8. should logout and clear user session signals', async () => {
    await firstValueFrom(service.login({ email: 'gamer@nexora.io' }));
    expect(service.isAuthenticated()).toBeTrue();

    service.logout();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });
});

describe('sanitizeReturnUrl — Open-Redirect Prevention Suite', () => {
  it('returns the fallback for null, undefined, and empty input', () => {
    expect(sanitizeReturnUrl(null)).toBe('/catalog');
    expect(sanitizeReturnUrl(undefined)).toBe('/catalog');
    expect(sanitizeReturnUrl('')).toBe('/catalog');
  });

  it('keeps safe relative paths untouched', () => {
    expect(sanitizeReturnUrl('/library')).toBe('/library');
    expect(sanitizeReturnUrl('/wishlist?filter=on-sale')).toBe('/wishlist?filter=on-sale');
    expect(sanitizeReturnUrl('/studio/games/game_001/edit')).toBe('/studio/games/game_001/edit');
  });

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeReturnUrl('//evil.com')).toBe('/catalog');
  });

  it('rejects absolute URLs with schemes', () => {
    expect(sanitizeReturnUrl('https://evil.com')).toBe('/catalog');
    expect(sanitizeReturnUrl('http://evil.com/library')).toBe('/catalog');
    expect(sanitizeReturnUrl('javascript:alert(1)')).toBe('/catalog');
  });

  it('rejects backslash paths that browsers may treat as protocol-relative', () => {
    expect(sanitizeReturnUrl('/\\evil')).toBe('/catalog');
  });

  it('rejects non-path inputs without a leading slash', () => {
    expect(sanitizeReturnUrl('evil.com')).toBe('/catalog');
  });
});

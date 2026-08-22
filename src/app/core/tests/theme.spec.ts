import { TestBed } from '@angular/core/testing';
import { ThemeService } from '../theme/theme.service';
import { LocalStoreService } from '../persistence/local-store.service';

describe('ThemeService — Dual-Theme Steam Mode Suite', () => {
  let service: ThemeService;
  let localStore: LocalStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeService, LocalStoreService]
    });
    localStore = TestBed.inject(LocalStoreService);
    localStore.clear();
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStore.clear();
  });

  it('1. should default to dark theme on cold start', () => {
    expect(service.currentTheme()).toBe('dark');
  });

  it('2. should toggle theme between dark and light', () => {
    expect(service.currentTheme()).toBe('dark');

    service.toggleTheme();
    expect(service.currentTheme()).toBe('light');

    service.toggleTheme();
    expect(service.currentTheme()).toBe('dark');
  });

  it('3. should persist chosen theme to LocalStore', () => {
    service.setTheme('light');
    expect(localStore.getItem('app_theme')).toBe('light');

    service.setTheme('dark');
    expect(localStore.getItem('app_theme')).toBe('dark');
  });
});

import { Injectable, signal, inject } from '@angular/core';
import { LocalStoreService } from '../persistence/local-store.service';

export type AppTheme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app_theme';
  private localStore = inject(LocalStoreService);

  readonly currentTheme = signal<AppTheme>(this.getInitialTheme());

  constructor() {
    this.applyThemeToDom(this.currentTheme());
  }

  private getInitialTheme(): AppTheme {
    const saved = this.localStore.getItem<AppTheme>(this.THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'dark'; // Default to cyberpunk void dark
  }

  private applyThemeToDom(theme: AppTheme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  toggleTheme(): void {
    const nextTheme: AppTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.currentTheme.set(nextTheme);
    this.localStore.setItem(this.THEME_KEY, nextTheme);
    this.applyThemeToDom(nextTheme);
  }

  setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    this.localStore.setItem(this.THEME_KEY, theme);
    this.applyThemeToDom(theme);
  }
}

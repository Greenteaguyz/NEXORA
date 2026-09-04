import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { resolveTranslation } from './translation.util';
import { en } from './i18n/en';

export type Language = 'en' | 'kh';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private platformId = inject(PLATFORM_ID);
  
  private readonly _activeLang = signal<Language>('en');
  readonly activeLang = computed(() => this._activeLang());

  // Dictionary Signals
  private readonly _enDict = signal<Record<string, string>>(en);
  private readonly _khDict = signal<Record<string, string> | null>(null);

  readonly currentDictionary = computed(() => {
    return this._activeLang() === 'en' ? this._enDict() : (this._khDict() || this._enDict());
  });

  readonly t = computed(() => {
    return (key: string) => resolveTranslation(key, this.currentDictionary(), this._enDict());
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('nexora_lang') as Language;
      if (savedLang === 'kh' || savedLang === 'en') {
        this.setLanguage(savedLang);
      }
    }
  }

  setLanguage(lang: Language) {
    if (lang === 'kh' && !this._khDict()) {
      import('./i18n/kh').then(m => {
        this._khDict.set(m.kh);
        this._activeLang.set(lang);
        this.saveLanguage(lang);
      }).catch(err => {
        console.error('Failed to load KH dictionary', err);
      });
    } else {
      this._activeLang.set(lang);
      this.saveLanguage(lang);
    }
  }

  private saveLanguage(lang: Language) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('nexora_lang', lang);
      if (lang === 'kh') {
        document.body.classList.add('lang-kh');
      } else {
        document.body.classList.remove('lang-kh');
      }
    }
  }

  translate(key: string): string {
    return resolveTranslation(key, this.currentDictionary(), this._enDict());
  }
}

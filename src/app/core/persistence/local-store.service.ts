import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStoreService {
  private readonly PREFIX = 'nexora_';
  private memoryCache = new Map<string, any>();

  getItem<T>(key: string): T | null {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      const data = localStorage.getItem(this.PREFIX + key);
      const parsed = data ? (JSON.parse(data) as T) : null;
      if (parsed !== null) {
        this.memoryCache.set(key, parsed);
      }
      return parsed;
    } catch (e) {
      console.warn(`LocalStoreService: Failed to read key "${key}"`, e);
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    this.memoryCache.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      }
    } catch (e) {
      console.error(`LocalStoreService: Failed to write key "${key}"`, e);
    }
  }

  removeItem(key: string): void {
    this.memoryCache.delete(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.PREFIX + key);
      }
    } catch (e) {
      console.error(`LocalStoreService: Failed to remove key "${key}"`, e);
    }
  }

  clearAll(): void {
    this.memoryCache.clear();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.PREFIX)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      console.error('LocalStoreService: Failed to clear all items', e);
    }
  }

  clear(): void {
    this.clearAll();
  }

  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }
}

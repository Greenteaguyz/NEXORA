import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStoreService {
  private readonly PREFIX = 'nexora_';

  getItem<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(this.PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn(`LocalStoreService: Failed to read key "${key}"`, e);
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`LocalStoreService: Failed to write key "${key}"`, e);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (e) {
      console.error(`LocalStoreService: Failed to remove key "${key}"`, e);
    }
  }

  clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error('LocalStoreService: Failed to clear all items', e);
    }
  }
}

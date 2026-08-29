import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Ref-counted body scroll lock for fullscreen overlays (modals, drawers, palette).
 * Freezes background scroll on desktop and mobile (iOS Safari included) without
 * layout shift, and restores the exact scroll position on final unlock.
 */
@Injectable({ providedIn: 'root' })
export class ScrollLockService {
  private readonly platformId = inject(PLATFORM_ID);

  private lockCount = 0;
  private savedScrollY = 0;
  private previousBodyPaddingRight: string | null = null;
  private readonly lockClass = 'app-scroll-locked';

  private get canUseDom(): boolean {
    return isPlatformBrowser(this.platformId) && typeof document !== 'undefined';
  }

  lock(): void {
    this.lockCount++;
    if (this.lockCount > 1 || !this.canUseDom) return;

    this.savedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    document.documentElement.classList.add(this.lockClass);
    document.body.classList.add(this.lockClass);
    document.body.style.setProperty('--app-scroll-lock-offset', `-${this.savedScrollY}px`);

    // Scrollbar compensation: prevent content jump when overflow is hidden.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      this.previousBodyPaddingRight = document.body.style.paddingRight || null;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  unlock(): void {
    this.lockCount = Math.max(0, this.lockCount - 1);
    if (this.lockCount > 0 || !this.canUseDom) return;

    document.documentElement.classList.remove(this.lockClass);
    document.body.classList.remove(this.lockClass);

    if (this.previousBodyPaddingRight !== null) {
      document.body.style.paddingRight = this.previousBodyPaddingRight;
    } else {
      document.body.style.removeProperty('padding-right');
    }
    this.previousBodyPaddingRight = null;

    // Restore scroll position instantly (bypass smooth scrolling).
    const el = document.documentElement;
    const prevBehavior = el.style.scrollBehavior;
    el.style.scrollBehavior = 'auto';
    window.scrollTo(0, this.savedScrollY);
    el.style.scrollBehavior = prevBehavior;

    document.body.style.removeProperty('--app-scroll-lock-offset');
  }

  isLocked(): boolean {
    return this.lockCount > 0;
  }
}

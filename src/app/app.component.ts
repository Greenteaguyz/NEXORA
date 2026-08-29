import { Component, signal, HostListener, inject, PLATFORM_ID, OnDestroy, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from './core/services/toast.service';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ToastComponent } from './shared/ui/toast/toast.component';
import { CommandPaletteComponent } from './shared/ui/command-palette/command-palette.component';
import { DownloadTrayComponent } from './shared/ui/download-tray/download-tray.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent, CommandPaletteComponent, DownloadTrayComponent],
  styles: [`
    /* Back-to-top: sits above the download tray footprint (tray top edge ~64px)
       so the two never overlap; right offset clears the virtual scroll thumb (right: 4px). */
    .btn-back-to-top {
      position: fixed;
      right: var(--space-6);
      bottom: calc(var(--space-6) + 64px + env(safe-area-inset-bottom, 0px));
      z-index: 900;
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      background: var(--bg-elevated);
      border: 1px solid var(--border-card);
      border-radius: var(--radius-lg);
      color: var(--text-primary);
      cursor: pointer;
      box-shadow: none;
      transition: border-color 0.2s ease, background-color 0.2s ease;
    }

    .btn-back-to-top:hover {
      border-color: var(--accent-500);
      background-color: rgba(102, 192, 244, 0.12);
      color: var(--accent-400);
    }

    .btn-back-to-top:focus-visible {
      outline: 2px solid var(--text-primary);
      outline-offset: 2px;
    }

    .btn-back-to-top svg {
      width: 22px;
      height: 22px;
      display: block;
    }

    @media (prefers-reduced-motion: reduce) {
      .btn-back-to-top {
        transition: none;
      }
    }
  `],
  template: `
    <a href="#main-content" class="skip-to-content">Skip to main content</a>
    <app-header></app-header>
    <main id="main-content" class="main-content" tabindex="-1">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
    <app-toast></app-toast>
    <app-download-tray></app-download-tray>
    <app-command-palette></app-command-palette>

    <!-- Pure Virtual Floating Overlay Scroll Indicator (0px Layout Displacement & 2s Auto-Hide) -->
    <div
      class="virtual-scroll-track"
      [class.active]="isScrollingActive() && isScrollable()"
      aria-hidden="true">
      <div
        class="virtual-scroll-thumb"
        [style.transform]="'translate3d(0, ' + scrollThumbTop() + 'px, 0)'">
      </div>
    </div>

    <!-- Back-to-top: rendered only after deep scroll; clears the download tray footprint -->
    @if (showBackToTop()) {
      <button
        type="button"
        class="btn-back-to-top"
        aria-label="Back to top"
        (click)="scrollToTop()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="19" x2="12" y2="5"/>
          <polyline points="5 12 12 5 19 12"/>
        </svg>
      </button>
    }
  `
})
export class AppComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  scrollThumbTop = signal<number>(0);
  isScrollable = signal<boolean>(false);
  isScrollingActive = signal<boolean>(false);
  showBackToTop = signal<boolean>(false);
  private scrollTimeout: any = null;
  private isRafScheduled = false;

  constructor() {
    // Guard-rejection feedback: guards redirect with a ?reason= param; the
    // root component (always alive) surfaces it as a toast and strips the
    // param from the URL. Browser-only: router URL rewriting touches history.
    if (isPlatformBrowser(this.platformId)) {
      this.router.events
        .pipe(
          filter((event): event is NavigationEnd => event instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => this.reportGuardRejection());
    }
  }

  /** Translate a guard-rejection ?reason= param into a toast, then strip it. */
  private reportGuardRejection(): void {
    const reason = this.router.routerState.snapshot.root.queryParamMap.get('reason');
    if (!reason) return;

    switch (reason) {
      case 'auth-required':
        this.toastService.show({
          type: 'info',
          title: 'Sign In Required',
          message: 'You must be signed in to view that page.'
        });
        break;
      case 'creator-required':
        this.toastService.show({
          type: 'warning',
          title: 'Creator Access',
          message: 'You need Creator access to view that page.'
        });
        break;
      case 'not-owner':
        this.toastService.show({
          type: 'error',
          title: 'Not Allowed',
          message: 'You do not own this listing.'
        });
        break;
      default:
        return;
    }

    // Strip the reason param in place. The follow-up NavigationEnd carries no
    // reason, so it cannot re-fire the toast (no loop).
    this.router.navigate([], {
      relativeTo: this.router.routerState.root,
      queryParams: { reason: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowScroll() {
    if (!isPlatformBrowser(this.platformId) || this.isRafScheduled) return;

    this.isRafScheduled = true;
    requestAnimationFrame(() => {
      this.isRafScheduled = false;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.showBackToTop.set(scrollY > 600);
      if (maxScroll > 20) {
        this.isScrollable.set(true);
        this.isScrollingActive.set(true);

        const isMobile = window.innerWidth <= 768;
        const topOffset = isMobile ? 62 : 74;
        const bottomOffset = isMobile ? 68 : 12;
        const thumbHeight = 48;
        const availableTrack = window.innerHeight - topOffset - bottomOffset - thumbHeight;
        const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
        this.scrollThumbTop.set(progress * Math.max(availableTrack, 0));

        // Reset 2.0-second auto-hide inactivity timer
        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
          this.isScrollingActive.set(false);
        }, 2000);
      } else {
        this.isScrollable.set(false);
        this.isScrollingActive.set(false);
      }
    });
  }

  /** Scroll to top; falls back to instant jump when reduced motion is requested. */
  scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  ngOnDestroy() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }
}

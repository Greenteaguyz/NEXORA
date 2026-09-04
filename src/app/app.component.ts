import { Component, signal, HostListener, inject, PLATFORM_ID, OnDestroy, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from './core/services/toast.service';
import { ContextMenuService } from './core/services/context-menu.service';
import { HoverCardService } from './core/services/hover-card.service';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ToastComponent } from './shared/ui/toast/toast.component';
import { CommandPaletteComponent } from './shared/ui/command-palette/command-palette.component';
import { DownloadTrayComponent } from './shared/ui/download-tray/download-tray.component';
import { ContextMenuComponent } from './shared/ui/context-menu/context-menu.component';
import { HoverCardComponent } from './shared/ui/hover-card/hover-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ToastComponent,
    CommandPaletteComponent,
    DownloadTrayComponent,
    ContextMenuComponent,
    HoverCardComponent
  ],
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
      background: var(--bg-surface, #1B2838);
      border: 1.5px solid var(--accent-400, #66C0F4);
      border-radius: var(--radius-lg, 8px);
      color: var(--accent-400, #66C0F4);
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      transform: translateY(0);
    }

    :host-context([data-theme="light"]) .btn-back-to-top {
      background: #FFFFFF;
      border: 1.5px solid #0078D4;
      color: #0078D4;
      box-shadow: 0 8px 24px rgba(0, 120, 212, 0.22);
    }

    .btn-back-to-top:hover {
      background: var(--accent-600, #0078D4);
      border-color: var(--accent-400, #66C0F4);
      color: #FFFFFF;
      box-shadow: 0 8px 28px rgba(0, 120, 212, 0.6);
    }

    :host-context([data-theme="light"]) .btn-back-to-top:hover {
      background: #0078D4;
      border-color: #005A9E;
      color: #FFFFFF;
    }

    .btn-back-to-top:focus-visible {
      outline: 2px solid var(--accent-400, #66C0F4);
      outline-offset: 2px;
    }

    .btn-back-to-top svg {
      width: 20px;
      height: 20px;
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
    @if (contextMenuService.isOpen()) {
      <app-context-menu
        [items]="contextMenuService.items()"
        [position]="contextMenuService.position()"
        (closed)="contextMenuService.close()">
      </app-context-menu>
    }
    @if (hoverCardService.isOpen() && hoverCardService.activeGame(); as activeGame) {
      <app-hover-card
        [game]="activeGame"
        [position]="hoverCardService.position()">
      </app-hover-card>
    }

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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
  contextMenuService = inject(ContextMenuService);
  hoverCardService = inject(HoverCardService);
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
      case 'game-not-found':
        this.toastService.show({
          type: 'warning',
          title: 'Game Not Found',
          message: "We couldn't find that game in our catalog."
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
    if (this.hoverCardService.isOpen()) {
      this.hoverCardService.close();
    }
    if (this.contextMenuService.isOpen()) {
      this.contextMenuService.close();
    }

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

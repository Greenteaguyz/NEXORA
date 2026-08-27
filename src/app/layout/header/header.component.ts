import { Component, ElementRef, PLATFORM_ID, inject, signal, computed, effect, HostListener, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { CommandPaletteService } from '../../core/services/command-palette.service';
import { WISHLIST_DATA } from '../../core/data/tokens';
import { RoleBadgeComponent } from '../../shared/ui/role-badge/role-badge.component';
import {
  staggerDelay,
  computeIndicatorGeometry,
  DrawerCloseScheduler
} from './header-animations';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RoleBadgeComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnDestroy {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  commandPaletteService = inject(CommandPaletteService);
  private router = inject(Router);
  private wishlistData = inject(WISHLIST_DATA);
  private platformId = inject(PLATFORM_ID);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  wishlistCount = signal(0);
  mobileMenuOpen = signal(false);
  drawerMounted = signal(false);
  headerHidden = signal(false);
  private lastScrollY = 0;
  private drawerReturnFocus: HTMLElement | null = null;
  private readonly closeScheduler = new DrawerCloseScheduler();

  readonly navIndicatorX = signal(0);
  readonly navIndicatorW = signal(0);
  readonly navIndicatorVisible = signal(false);
  readonly navIndicatorNoAnim = signal(true);
  private indicatorPrimed = false;
  private indicatorMeasureQueued = false;

  /** Template helper: per-section entrance stagger for the drawer (pure, testable). */
  readonly staggerDelay = staggerDelay;

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly isAuthPage = computed(() => {
    const url = this.currentUrl() || '';
    return url.includes('/login') || url.includes('/register') || url.includes('/forgot-password');
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.wishlistData.getWishlist(user.id).subscribe({
          next: (entries) => this.wishlistCount.set(entries ? entries.length : 0),
          error: () => this.wishlistCount.set(0)
        });
      } else {
        this.wishlistCount.set(0);
      }
    }, { allowSignalWrites: true });

    // Active-tab indicator: re-measure when the route moves .active or the tab set changes.
    effect(() => {
      this.currentUrl();
      this.authService.isAuthenticated();
      this.authService.isCreator();
      this.scheduleIndicatorMeasure();
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    this.closeScheduler.destroy();
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  private updateBodyScrollLock(locked: boolean): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = locked ? 'hidden' : '';
    }
  }

  toggleMobileMenu(): void {
    if (this.mobileMenuOpen()) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  private openMobileMenu(): void {
    // Invalidate any pending exit-unmount first: this is the rapid close→open race guard.
    this.closeScheduler.cancelPendingUnmount();
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      this.drawerReturnFocus = document.activeElement;
    }
    this.updateBodyScrollLock(true);

    if (this.drawerMounted()) {
      // Re-opening mid-exit: element exists, transition reverses from current position.
      this.mobileMenuOpen.set(true);
    } else {
      this.drawerMounted.set(true);
      // Two frames must pass so the off-screen mount state is fully committed
      // before .drawer-open lands — otherwise the slide-in starts raggedly.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.mobileMenuOpen.set(true));
      });
    }

    setTimeout(() => {
      (document.querySelector('.btn-close-drawer') as HTMLElement | null)?.focus();
    }, 50);
  }

  closeMobileMenu(): void {
    if (!this.mobileMenuOpen()) return;
    this.mobileMenuOpen.set(false);
    this.updateBodyScrollLock(false);
    this.drawerReturnFocus?.focus();
    this.drawerReturnFocus = null;
    // Exit transition plays; transitionend (fallback: timer) unmounts the drawer.
    this.closeScheduler.scheduleUnmount(() => this.drawerMounted.set(false));
  }

  onDrawerTransitionEnd(event: TransitionEvent): void {
    if (event.propertyName === 'transform' && !this.mobileMenuOpen()) {
      this.closeScheduler.completeIfExiting();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.mobileMenuOpen()) {
        this.closeMobileMenu();
      }
      return;
    }

    if (this.mobileMenuOpen() && event.key === 'Tab') {
      this.trapDrawerFocus(event);
    }
  }

  private trapDrawerFocus(event: KeyboardEvent): void {
    const drawer = document.querySelector('.mobile-drawer');
    if (!drawer) return;

    const focusable = drawer.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  switchAccount(email: string): void {
    this.authService.switchDemoUser(email).subscribe(() => {
      this.closeMobileMenu();
    });
  }

  private scheduleIndicatorMeasure(): void {
    if (!isPlatformBrowser(this.platformId) || this.indicatorMeasureQueued) return;
    this.indicatorMeasureQueued = true;
    requestAnimationFrame(() => {
      this.indicatorMeasureQueued = false;
      this.measureIndicator();
    });
  }

  private measureIndicator(): void {
    const navList = this.host.nativeElement.querySelector<HTMLElement>('.nav-links');
    if (!navList) {
      this.navIndicatorVisible.set(false);
      return;
    }
    const anchors = Array.from(navList.querySelectorAll<HTMLElement>('li a'));
    const tabs = anchors.map(anchor =>
      anchor.classList.contains('active')
        ? { left: anchor.offsetLeft, width: anchor.offsetWidth }
        : null
    );
    const geometry = computeIndicatorGeometry(navList.offsetWidth, tabs);
    if (!geometry) {
      this.navIndicatorVisible.set(false);
      return;
    }
    this.navIndicatorX.set(geometry.x);
    this.navIndicatorW.set(geometry.width);
    if (!this.indicatorPrimed) {
      // Position lands untransitioned (transitions are gated behind
      // .is-visible:not(.no-anim)); the next frame reveals in place.
      this.indicatorPrimed = true;
      requestAnimationFrame(() => {
        this.navIndicatorNoAnim.set(false);
        this.navIndicatorVisible.set(true);
      });
    } else {
      this.navIndicatorVisible.set(true);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleIndicatorMeasure();
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  triggerCommandPalette(): void {
    this.commandPaletteService.open();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window === 'undefined') return;
    const currentY = window.scrollY || document.documentElement.scrollTop;

    // Always keep header visible near the top or when mobile drawer is open
    if (this.mobileMenuOpen() || currentY <= 10) {
      this.headerHidden.set(false);
      this.lastScrollY = Math.max(0, currentY);
      return;
    }

    const delta = currentY - this.lastScrollY;
    if (Math.abs(delta) > 8) {
      if (delta > 0 && currentY > 60) {
        this.headerHidden.set(true);  // Scrolling down -> hide header
      } else if (delta < 0) {
        this.headerHidden.set(false); // Scrolling up -> reveal header
      }
      this.lastScrollY = currentY;
    }
  }
}

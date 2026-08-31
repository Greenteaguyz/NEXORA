import { Component, ElementRef, PLATFORM_ID, inject, signal, computed, effect, HostListener, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { CommandPaletteService } from '../../core/services/command-palette.service';
import { ScrollLockService } from '../../core/services/scroll-lock.service';
import { ToastService } from '../../core/services/toast.service';
import { WISHLIST_DATA } from '../../core/data/tokens';
import { RoleBadgeComponent } from '../../shared/ui/role-badge/role-badge.component';
import { ScrollLockDirective } from '../../shared/directives/scroll-lock.directive';
import {
  staggerDelay,
  computeIndicatorGeometry,
  DrawerCloseScheduler
} from './header-animations';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RoleBadgeComponent, ScrollLockDirective],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnDestroy {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  commandPaletteService = inject(CommandPaletteService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private wishlistData = inject(WISHLIST_DATA);
  private platformId = inject(PLATFORM_ID);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private scrollLock = inject(ScrollLockService);
  private headerScrollLockActive = false;

  wishlistCount = signal(0);
  private lastWishlistUserId: string | null = null;
  mobileMenuOpen = signal(false);
  drawerMounted = signal(false);
  public readonly logoutConfirmOpen = signal<boolean>(false);
  private logoutReturnFocus: HTMLElement | null = null;
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
        // Dedupe: skip refetch when the user identity is unchanged.
        if (this.lastWishlistUserId !== user.id) {
          this.lastWishlistUserId = user.id;
          this.wishlistData.getWishlist(user.id).subscribe({
            next: (entries) => this.wishlistCount.set(entries ? entries.length : 0),
            error: () => this.wishlistCount.set(0)
          });
        }
      } else {
        this.lastWishlistUserId = null;
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
    // Only release if this component actually engaged the ref-counted lock.
    if (this.headerScrollLockActive) {
      this.scrollLock.unlock();
      this.headerScrollLockActive = false;
    }
  }

  private updateBodyScrollLock(locked: boolean): void {
    if (locked === this.headerScrollLockActive) return;
    this.headerScrollLockActive = locked;
    locked ? this.scrollLock.lock() : this.scrollLock.unlock();
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
      // Log Out confirm modal owns Escape while open; the drawer must stay mounted.
      if (this.logoutConfirmOpen()) {
        this.cancelLogout();
        return;
      }
      if (this.mobileMenuOpen()) {
        this.closeMobileMenu();
      }
      return;
    }

    // The modal owns Tab while open: contain focus inside the dialog.
    if (this.logoutConfirmOpen()) {
      if (event.key === 'Tab') {
        this.trapModalFocus(event);
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

  private trapModalFocus(event: KeyboardEvent): void {
    const modal = this.host.nativeElement.querySelector<HTMLElement>('.modal-card');
    if (!modal) return;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    // Focus that drifted outside the overlay (e.g. body) is pulled back inside.
    const inside = modal.contains(document.activeElement);

    if (event.shiftKey) {
      if (!inside || document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (!inside || document.activeElement === last) {
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

  public requestLogout(event?: Event): void {
    // Duck-typed on purpose: instanceof HTMLElement breaks under SSR/test runtimes.
    const target = event?.currentTarget as HTMLElement | null;
    if (target && typeof target.focus === 'function') {
      this.logoutReturnFocus = target;
    }
    this.logoutConfirmOpen.set(true);
  }

  public cancelLogout(): void {
    if (!this.logoutConfirmOpen()) return;
    this.logoutConfirmOpen.set(false);
    this.logoutReturnFocus?.focus();
    this.logoutReturnFocus = null;
  }

  public confirmLogout(): void {
    if (!this.logoutConfirmOpen()) return;
    this.logoutConfirmOpen.set(false);
    this.logoutReturnFocus = null;
    this.authService.logout();
    this.closeMobileMenu();
    this.toastService.show({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been logged out.'
    });
  }

  public logout(): void {
    this.confirmLogout();
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

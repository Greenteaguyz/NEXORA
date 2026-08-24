import { Component, inject, signal, effect, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { WISHLIST_DATA } from '../../core/data/tokens';
import { RoleBadgeComponent } from '../../shared/ui/role-badge/role-badge.component';

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
  private wishlistData = inject(WISHLIST_DATA);

  wishlistCount = signal(0);
  mobileMenuOpen = signal(false);
  headerHidden = signal(false);
  private lastScrollY = 0;

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
    });
  }

  ngOnDestroy(): void {
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
    this.mobileMenuOpen.update(v => {
      const next = !v;
      this.updateBodyScrollLock(next);
      if (next) {
        setTimeout(() => {
          (document.querySelector('.btn-close-drawer') as HTMLElement)?.focus();
        }, 50);
      }
      return next;
    });
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    this.updateBodyScrollLock(false);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.mobileMenuOpen()) return;

    if (event.key === 'Escape') {
      this.closeMobileMenu();
      return;
    }

    if (event.key === 'Tab') {
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

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  triggerCommandPalette(): void {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
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

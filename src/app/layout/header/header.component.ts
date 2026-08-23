import { Component, inject, signal, effect } from '@angular/core';
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
export class HeaderComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private wishlistData = inject(WISHLIST_DATA);

  wishlistCount = signal(0);
  mobileMenuOpen = signal(false);

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

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
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
}

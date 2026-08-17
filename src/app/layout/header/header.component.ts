import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
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

  mobileMenuOpen = signal(false);

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
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { USERS_DATA, LIBRARY_DATA, WISHLIST_DATA, ORDERS_DATA, GAMES_DATA } from '../../core/data/tokens';
import { RoleBadgeComponent } from '../../shared/ui/role-badge/role-badge.component';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';

import { LocalStoreService } from '../../core/persistence/local-store.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, 
    RoleBadgeComponent, 
    LoadingSpinnerComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  private localStore = inject(LocalStoreService);
  private usersData = inject(USERS_DATA);
  private libraryData = inject(LIBRARY_DATA);
  private wishlistData = inject(WISHLIST_DATA);
  private ordersData = inject(ORDERS_DATA);
  private gamesData = inject(GAMES_DATA);

  ownedCount = 0;
  wishlistCount = 0;
  ordersCount = 0;
  loading = true;

  // Edit Profile State
  isEditing = false;
  editDisplayName = '';
  editBio = '';
  saving = false;
  saveSuccess = false;

  // Reset DB State
  showResetConfirm = false;
  resetting = false;
  resetSuccess = false;

  ngOnInit(): void {
    this.loadStats();
    this.initEditForm();
  }

  loadStats(): void {
    const user = this.auth.currentUser();
    if (!user) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.libraryData.getLibrary(user.id).subscribe(libs => {
      this.ownedCount = libs ? libs.length : 0;
    });

    this.wishlistData.getWishlist(user.id).subscribe(wishes => {
      this.wishlistCount = wishes ? wishes.length : 0;
    });

    this.ordersData.getOrders(user.id).subscribe(ords => {
      this.ordersCount = ords ? ords.length : 0;
      this.loading = false;
    });
  }

  initEditForm(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.editDisplayName = user.displayName;
      this.editBio = user.bio || '';
    }
  }

  startEditing(): void {
    this.initEditForm();
    this.isEditing = true;
    this.saveSuccess = false;
  }

  cancelEditing(): void {
    this.isEditing = false;
  }

  saveProfile(): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.saving = true;
    this.auth.updateProfile({
      displayName: this.editDisplayName.trim() || user.displayName,
      bio: this.editBio.trim()
    }).subscribe({
      next: () => {
        this.saving = false;
        this.isEditing = false;
        this.saveSuccess = true;
        setTimeout(() => { this.saveSuccess = false; }, 3000);
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  toggleCreatorRole(): void {
    this.auth.toggleCreatorRole().subscribe();
  }

  switchPersona(email: string): void {
    this.auth.switchDemoUser(email).subscribe(() => {
      this.loadStats();
      this.initEditForm();
    });
  }

  confirmResetDatabase(): void {
    this.showResetConfirm = true;
  }

  cancelResetDatabase(): void {
    this.showResetConfirm = false;
  }

  executeResetDatabase(): void {
    this.resetting = true;
    this.localStore.clearAll();
    this.gamesData.resetToDefaultSeed().subscribe({
      next: () => {
        this.resetting = false;
        this.showResetConfirm = false;
        this.resetSuccess = true;
        this.loadStats();
        setTimeout(() => {
          this.resetSuccess = false;
          window.location.reload();
        }, 1200);
      },
      error: () => {
        this.resetting = false;
      }
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Member since 2026';
    const d = new Date(dateString);
    return 'Member since ' + d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}

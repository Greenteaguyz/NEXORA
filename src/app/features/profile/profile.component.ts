import { Component, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PAYMENTS_DATA } from '../../core/data/tokens';
import { formatUsd } from '../../core/data/payments/payment-logic';
import { USERS_DATA, LIBRARY_DATA, WISHLIST_DATA, ORDERS_DATA, GAMES_DATA } from '../../core/data/tokens';
import { RoleBadgeComponent } from '../../shared/ui/role-badge/role-badge.component';
import { ScrollLockDirective } from '../../shared/directives/scroll-lock.directive';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, 
    RoleBadgeComponent,
    ScrollLockDirective
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnDestroy {
  auth = inject(AuthService);
  private paymentsData = inject(PAYMENTS_DATA);
  private usersData = inject(USERS_DATA);
  private libraryData = inject(LIBRARY_DATA);
  private wishlistData = inject(WISHLIST_DATA);
  private ordersData = inject(ORDERS_DATA);
  private gamesData = inject(GAMES_DATA);

  ownedCount = 0;
  wishlistCount = 0;
  ordersCount = 0;
  walletBalance = '$0.00';
  loading = true;

  // Edit Profile State
  isEditing = false;
  editDisplayName = '';
  editBio = '';
  editAvatarUrl = '';
  avatarUploadError = '';
  isDragging = false;
  saving = false;
  saveSuccess = false;

  // Preset Avatars Gallery
  readonly presetAvatars = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=cyberpunk',
    'https://api.dicebear.com/7.x/bottts/svg?seed=bob',
    'https://api.dicebear.com/7.x/bottts/svg?seed=alice',
    'https://api.dicebear.com/7.x/bottts/svg?seed=retro_gamer',
    'https://api.dicebear.com/7.x/bottts/svg?seed=pixel_warrior',
    'https://api.dicebear.com/7.x/bottts/svg?seed=steampunk_pilot'
  ];

  // Disable Creator Confirmation Modal State
  showDisableCreatorModal = false;
  countdownSeconds = 5;
  private countdownTimerId: ReturnType<typeof setInterval> | null = null;

  // Reset DB State

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.isEditing = false;
      this.showDisableCreatorModal = false;
      this.clearCountdownTimer();
      this.loadStats(user);
      this.initEditForm(user);
    });
  }

  loadStats(user = this.auth.currentUser()): void {
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

    this.paymentsData.getWalletSnapshot(user.id).subscribe(snap => {
      this.walletBalance = formatUsd(snap.wallet?.balance ?? 0);
    });
  }

  initEditForm(user = this.auth.currentUser()): void {
    if (user) {
      this.editDisplayName = user.displayName;
      this.editBio = user.bio || '';
      this.editAvatarUrl = user.avatarUrl || '';
      this.avatarUploadError = '';
    }
  }

  startEditing(): void {
    this.initEditForm();
    this.isEditing = true;
    this.saveSuccess = false;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.avatarUploadError = '';
  }

  selectPresetAvatar(url: string): void {
    this.editAvatarUrl = url;
    this.avatarUploadError = '';
  }

  removeAvatar(): void {
    this.editAvatarUrl = '';
    this.avatarUploadError = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.processFile(input.files[0]);
    input.value = ''; // reset so same file can be re-selected if needed
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  private processFile(file: File): void {
    this.avatarUploadError = '';

    // Validate MIME type
    if (!file.type.startsWith('image/')) {
      this.avatarUploadError = 'Please upload a valid image file (PNG, JPG, WebP, GIF, SVG).';
      return;
    }

    // Validate size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.avatarUploadError = `Image file exceeds maximum limit of 5MB (current: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawDataUrl = reader.result;
        // If SVG, keep raw string; otherwise compress via Canvas to 512x512 square WebP
        if (file.type === 'image/svg+xml') {
          this.editAvatarUrl = rawDataUrl;
        } else {
          this.compressAvatarImage(rawDataUrl, 512, 0.88);
        }
      }
    };
    reader.onerror = () => {
      this.avatarUploadError = 'Failed to read image file. Please try another image.';
    };
    reader.readAsDataURL(file);
  }

  private compressAvatarImage(dataUrl: string, maxDim = 512, quality = 0.88): void {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // Calculate center-cropped square dimensions
        const minSide = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - minSide) / 2;
        const sy = (img.naturalHeight - minSide) / 2;

        const targetDim = Math.min(minSide, maxDim);
        const canvas = document.createElement('canvas');
        canvas.width = targetDim;
        canvas.height = targetDim;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          this.editAvatarUrl = dataUrl;
          return;
        }

        // Draw center-cropped square
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDim, targetDim);

        // Export as WebP with fallback
        let compressed = canvas.toDataURL('image/webp', quality);
        if (!compressed.startsWith('data:image/webp')) {
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        this.editAvatarUrl = compressed;
      } catch {
        this.editAvatarUrl = dataUrl;
      }
    };
    img.onerror = () => {
      this.editAvatarUrl = dataUrl;
    };
    img.src = dataUrl;
  }

  saveProfile(): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.saving = true;
    this.auth.updateProfile({
      displayName: this.editDisplayName.trim() || user.displayName,
      bio: this.editBio.trim(),
      avatarUrl: this.editAvatarUrl.trim() || user.avatarUrl
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

  initiateToggleCreatorRole(): void {
    if (!this.auth.isCreator()) {
      // Inactive -> enable immediately
      this.auth.toggleCreatorRole().subscribe();
    } else {
      // Active -> trigger 5-second confirmation reminder modal
      this.openDisableCreatorModal();
    }
  }

  openDisableCreatorModal(): void {
    this.clearCountdownTimer();
    this.countdownSeconds = 5;
    this.showDisableCreatorModal = true;

    this.countdownTimerId = setInterval(() => {
      if (this.countdownSeconds > 0) {
        this.countdownSeconds--;
      } else {
        // Stop countdown at 0 — DO NOT auto-dismiss! Keep modal open for user confirmation.
        this.clearCountdownTimer();
      }
    }, 1000);
  }

  cancelDisableCreator(): void {
    this.clearCountdownTimer();
    this.showDisableCreatorModal = false;
  }

  confirmDisableCreator(): void {
    this.clearCountdownTimer();
    this.showDisableCreatorModal = false;
    this.auth.toggleCreatorRole().subscribe();
  }

  toggleCreatorRole(): void {
    this.initiateToggleCreatorRole();
  }

  private clearCountdownTimer(): void {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
  }

  ngOnDestroy(): void {
    this.clearCountdownTimer();
  }

  switchPersona(email: string): void {
    this.auth.switchDemoUser(email).subscribe(() => {
      this.loadStats();
      this.initEditForm();
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Member since 2026';
    const d = new Date(dateString);
    return 'Member since ' + d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}

import { Component, inject, effect, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  validatePasswordStrength,
  passwordStrengthScore,
  PasswordValidationResult,
  ERR_LOCKED_OUT,
  ERR_INCORRECT_PASSWORD
} from '../../core/auth/password-logic';
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
  toastService = inject(ToastService);
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
  readonly countdownTotal = 5;
  countdownSeconds = 5;
  private countdownTimerId: ReturnType<typeof setInterval> | null = null;

  get countdownProgressPercent(): number {
    return Math.max(0, Math.min(100, ((this.countdownTotal - this.countdownSeconds) / this.countdownTotal) * 100));
  }

  // Change Password State
  showChangePasswordModal = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordError = '';
  savingPassword = false;
  lockoutRemainingSeconds = 0;
  private lockoutTimerId: ReturnType<typeof setInterval> | null = null;
  private changePasswordOpener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.isEditing = false;
      this.showDisableCreatorModal = false;
      this.clearCountdownTimer();
      this.closeChangePasswordModal();
      this.clearLockoutTimer();
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
    this.countdownSeconds = this.countdownTotal;
    this.showDisableCreatorModal = true;

    this.countdownTimerId = setInterval(() => {
      if (this.countdownSeconds > 0) {
        this.countdownSeconds = Math.max(0, this.countdownSeconds - 1);
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
    if (this.countdownSeconds > 0) {
      console.warn('[ProfileComponent] Premature deactivation rejected: countdown active.');
      return;
    }
    this.clearCountdownTimer();
    this.showDisableCreatorModal = false;
    this.auth.toggleCreatorRole().subscribe();
  }

  toggleCreatorRole(): void {
    this.initiateToggleCreatorRole();
  }

  // --- Account Security & Password Management ---
  hasPassword(): boolean {
    return this.auth.hasPassword();
  }

  get newPasswordScore(): 0 | 1 | 2 | 3 {
    return passwordStrengthScore(this.newPassword);
  }

  get newPasswordValidation(): PasswordValidationResult {
    return validatePasswordStrength(this.newPassword);
  }

  get isChangePasswordFormValid(): boolean {
    if (this.lockoutRemainingSeconds > 0 || this.savingPassword) {
      return false;
    }
    if (this.currentPassword.trim().length === 0) {
      return false;
    }
    if (this.currentPassword.trim() === this.newPassword.trim()) {
      return false;
    }
    return this.newPasswordValidation.valid && this.newPassword === this.confirmPassword;
  }

  openChangePasswordModal(event?: MouseEvent): void {
    this.changePasswordOpener = (event?.currentTarget as HTMLElement) || null;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.passwordError = '';
    this.savingPassword = false;
    this.showChangePasswordModal = true;
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.passwordError = '';
    this.savingPassword = false;
    if (this.changePasswordOpener) {
      this.changePasswordOpener.focus();
      this.changePasswordOpener = null;
    }
  }

  submitChangePassword(): void {
    if (!this.isChangePasswordFormValid || this.savingPassword) {
      return;
    }

    if (this.currentPassword.trim() === this.newPassword.trim()) {
      this.passwordError = 'New password cannot be the same as your current password';
      return;
    }

    this.savingPassword = true;
    this.passwordError = '';

    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.savingPassword = false;
        this.toastService.show({
          type: 'success',
          title: 'Password updated',
          message: 'Your password has been changed successfully.'
        });
        this.closeChangePasswordModal();
      },
      error: (err: any) => {
        this.savingPassword = false;
        if (err?.code === ERR_LOCKED_OUT) {
          const remainingMs = err.remainingMs || 60000;
          this.startLockoutCountdown(Math.ceil(remainingMs / 1000));
          this.passwordError = `Account locked. Try again in ${this.lockoutRemainingSeconds}s.`;
        } else if (err?.code === ERR_INCORRECT_PASSWORD) {
          this.passwordError = err.message || 'Incorrect current password.';
        } else {
          this.passwordError = err?.message || 'Failed to update password. Please try again.';
        }
      }
    });
  }

  private startLockoutCountdown(seconds: number): void {
    this.clearLockoutTimer();
    this.lockoutRemainingSeconds = seconds;
    this.lockoutTimerId = setInterval(() => {
      if (this.lockoutRemainingSeconds > 1) {
        this.lockoutRemainingSeconds--;
        this.passwordError = `Account locked. Try again in ${this.lockoutRemainingSeconds}s.`;
      } else {
        this.clearLockoutTimer();
        this.lockoutRemainingSeconds = 0;
        this.passwordError = '';
      }
    }, 1000);
  }

  private clearLockoutTimer(): void {
    if (this.lockoutTimerId) {
      clearInterval(this.lockoutTimerId);
      this.lockoutTimerId = null;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showChangePasswordModal) {
      this.closeChangePasswordModal();
    }
  }

  private clearCountdownTimer(): void {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
  }

  ngOnDestroy(): void {
    this.clearCountdownTimer();
    this.clearLockoutTimer();
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

import { Component, inject, OnInit, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Game } from '../../core/models/game.model';
import { User } from '../../core/models/user.model';
import { Order } from '../../core/models/order.model';
import { GAMES_DATA, USERS_DATA, WISHLIST_DATA, LIBRARY_DATA, ORDERS_DATA } from '../../core/data/tokens';
import { AuthService } from '../../core/auth/auth.service';
import { DownloadService } from '../../core/services/download.service';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { PurchaseConfirmModalComponent, PurchaseConfirmationEvent } from '../../shared/ui/purchase-confirm-modal/purchase-confirm-modal.component';
import { ScrollLockDirective } from '../../shared/directives/scroll-lock.directive';

export interface SpecItem {
  icon: 'os' | 'cpu' | 'ram' | 'gpu' | 'directx' | 'storage';
  label: string;
  value: string;
}

export interface SpecTier {
  tierId: 'minimum' | 'recommended';
  title: string;
  targetBadge: string;
  targetDesc: string;
  items: SpecItem[];
}

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    LoadingSpinnerComponent, 
    EmptyStateComponent,
    PurchaseConfirmModalComponent,
    ScrollLockDirective
  ],
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.css']
})
export class GameDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private gamesData = inject(GAMES_DATA);
  private usersData = inject(USERS_DATA);
  private wishlistData = inject(WISHLIST_DATA);
  private libraryData = inject(LIBRARY_DATA);
  private ordersData = inject(ORDERS_DATA);
  private downloadService = inject(DownloadService);
  authService = inject(AuthService);

  game: Game | null = null;
  creator: User | null = null;
  loading = true;
  isWishlisted = false;
  isOwned = false;

  // Purchase & Creator Modal State
  showPurchaseModal = false;
  purchaseProcessing = false;
  showCreatorNoticeModal = false;
  showOrderConfirmedModal = false;
  confirmedOrder: Order | null = null;
  showFreeClaimToast = false;
  showWishlistRemoveModal = false;
  showLibraryRemoveModal = false;

  get isCreatorOwner(): boolean {
    const user = this.authService.currentUser();
    return !!this.game && !!user && this.game.ownerId === user.id;
  }

  openCreatorNoticeModal(): void {
    this.showCreatorNoticeModal = true;
  }

  closeCreatorNoticeModal(): void {
    this.showCreatorNoticeModal = false;
  }

  closeFreeClaimToast(): void {
    this.showFreeClaimToast = false;
  }

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.isWishlisted = false;
        this.isOwned = false;
      } else if (this.game) {
        this.checkWishlist(this.game.id);
        this.checkOwnership(this.game.id);
      }
    });
  }

  // Media Gallery Stage & Lightbox
  selectedStageIndex = 0;
  lightboxActive = false;
  activeScreenshotIndex = 0;

  // System Requirements State
  selectedOs: 'windows' | 'linux' = 'windows';
  selectedSpecsTab: 'minimum' | 'recommended' = 'minimum';

  // Target Download Platform Build
  selectedDownloadPlatform: 'windows' | 'linux' = 'windows';
  copiedChecksum = false;

  get currentPlatformInstallerInfo(): { osName: string; ext: string; size: string; api: string; hash: string } {
    if (this.selectedDownloadPlatform === 'linux') {
      return {
        osName: 'Linux & SteamOS',
        ext: 'Native AppImage (.tar.gz)',
        size: this.isRetro2D ? '310 MB' : '1.78 GB',
        api: 'Vulkan 1.2+ / Mesa 22.0+',
        hash: 'b9e5d38198f834201c3958e0d1f6b0f3541209753cc4f832b058e21f94572a01'
      };
    }
    return {
      osName: 'Windows 10/11 (64-bit)',
      ext: 'Standalone Setup (.exe)',
      size: this.packageSize,
      api: 'DirectX 11 / Vulkan 1.2',
      hash: 'a8f4c29188e734190b2847d9c0e5a9f2430198642bb3e721a947d10e83461f90'
    };
  }

  setDownloadPlatform(platform: 'windows' | 'linux'): void {
    this.selectedDownloadPlatform = platform;
  }

  copyChecksum(): void {
    const hash = this.currentPlatformInstallerInfo.hash;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hash).catch(() => {});
    }
    this.copiedChecksum = true;
    setTimeout(() => {
      this.copiedChecksum = false;
    }, 2500);
  }

  setOs(os: 'windows' | 'linux'): void {
    this.selectedOs = os;
  }

  setSpecsTab(tab: 'minimum' | 'recommended'): void {
    this.selectedSpecsTab = tab;
  }

  private touchStartX = 0;
  private touchStartY = 0;

  selectStageImage(index: number): void {
    this.selectedStageIndex = index;
  }

  nextStageImage(): void {
    const total = this.galleryImages.length;
    if (total > 1) {
      this.selectedStageIndex = (this.selectedStageIndex + 1) % total;
    }
  }

  prevStageImage(): void {
    const total = this.galleryImages.length;
    if (total > 1) {
      this.selectedStageIndex = (this.selectedStageIndex - 1 + total) % total;
    }
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (event.changedTouches.length === 1) {
      const deltaX = event.changedTouches[0].clientX - this.touchStartX;
      const deltaY = event.changedTouches[0].clientY - this.touchStartY;
      
      // Horizontal swipe detected (threshold 35px)
      if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          this.nextStageImage();
        } else {
          this.prevStageImage();
        }
      }
    }
  }

  get galleryImages(): string[] {
    if (!this.game) return [];
    if (this.game.screenshotUrls && this.game.screenshotUrls.length > 0) {
      return this.game.screenshotUrls;
    }
    return [this.game.coverImageUrl];
  }

  get isRetro2D(): boolean {
    if (!this.game) return false;
    return this.game.tags.includes('Pixel Art') && !this.game.tags.includes('Racing') && !this.game.tags.includes('Strategy');
  }

  get packageSize(): string {
    if (!this.game) return '1.20 GB';
    if (this.isRetro2D) return '340 MB';
    return '1.85 GB';
  }

  get releaseDate(): string {
    if (!this.game || !this.game.createdAt) return 'Aug 15, 2026';
    const d = new Date(this.game.createdAt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  get minimumSpecs(): SpecTier {
    const is2D = this.isRetro2D;
    const isWin = this.selectedOs === 'windows';
    return {
      tierId: 'minimum',
      title: 'MINIMUM:',
      targetBadge: is2D ? '720p @ 60 FPS' : '1080p @ 30 FPS',
      targetDesc: 'Low / Medium Settings',
      items: [
        {
          icon: 'os',
          label: 'OS',
          value: isWin ? 'Windows 10 (64-bit)' : 'Ubuntu 22.04 LTS / Debian 12 (64-bit)'
        },
        {
          icon: 'cpu',
          label: 'Processor',
          value: is2D ? 'Intel Core 2 Duo E8400 / AMD Athlon 64' : 'Intel Core i5-4460 / AMD FX-6300'
        },
        {
          icon: 'ram',
          label: 'Memory',
          value: is2D ? '2 GB RAM' : '8 GB RAM'
        },
        {
          icon: 'gpu',
          label: 'Graphics',
          value: is2D ? 'Intel HD Graphics 4000' : 'NVIDIA GeForce GTX 960 (4GB) / AMD Radeon R9 280 (3GB)'
        },
        {
          icon: 'directx',
          label: isWin ? 'DirectX' : 'Graphics API',
          value: isWin ? (is2D ? 'Version 9.0c' : 'Version 11 or Vulkan 1.2') : 'Vulkan 1.2+ / Mesa 22.0+'
        },
        {
          icon: 'storage',
          label: 'Storage',
          value: is2D ? '500 MB available space' : '4.5 GB available space'
        }
      ]
    };
  }

  get recommendedSpecs(): SpecTier {
    const is2D = this.isRetro2D;
    const isWin = this.selectedOs === 'windows';
    return {
      tierId: 'recommended',
      title: 'RECOMMENDED:',
      targetBadge: is2D ? '1080p @ 60 FPS' : '1440p+ @ 60 FPS',
      targetDesc: 'High / Ultra Settings',
      items: [
        {
          icon: 'os',
          label: 'OS',
          value: isWin ? 'Windows 11 (64-bit)' : 'Arch Linux / Fedora 40 (64-bit)'
        },
        {
          icon: 'cpu',
          label: 'Processor',
          value: is2D ? 'Intel Core i3-4130 / AMD Ryzen 3 1200' : 'Intel Core i7-8700K / AMD Ryzen 5 3600X'
        },
        {
          icon: 'ram',
          label: 'Memory',
          value: is2D ? '4 GB RAM' : '16 GB RAM'
        },
        {
          icon: 'gpu',
          label: 'Graphics',
          value: is2D ? 'NVIDIA GeForce GT 1030 / AMD Radeon RX 550' : 'NVIDIA GeForce RTX 3060 (8GB) / AMD Radeon RX 6600 XT (8GB)'
        },
        {
          icon: 'directx',
          label: isWin ? 'DirectX' : 'Graphics API',
          value: isWin ? (is2D ? 'Version 11' : 'Version 12 Ultimate') : 'Vulkan 1.3 Native / Proton GE'
        },
        {
          icon: 'storage',
          label: 'Storage',
          value: is2D ? '1 GB available space' : '4.5 GB available space (SSD recommended)'
        }
      ]
    };
  }

  get allSpecTiers(): SpecTier[] {
    return [this.minimumSpecs, this.recommendedSpecs];
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadGame(id);
      }
    });
  }

  loadGame(id: string): void {
    this.loading = true;
    this.selectedStageIndex = 0;
    this.activeScreenshotIndex = 0;
    this.selectedOs = 'windows';
    this.selectedSpecsTab = 'minimum';
    this.gamesData.getGameById(id).subscribe(game => {
      if (!game) {
        this.game = null;
        this.loading = false;
        return;
      }

      this.game = game;
      this.loadCreator(game.ownerId);
      this.checkWishlist(game.id);
      this.checkOwnership(game.id);
      this.loading = false;
    });
  }

  private loadCreator(ownerId: string): void {
    this.usersData.getUser(ownerId).subscribe(user => {
      this.creator = user || {
        id: ownerId,
        email: 'creator@nexora.io',
        displayName: 'Independent Studio',
        roles: ['creator'],
        avatarUrl: 'assets/logo-icon.svg',
        bio: 'Independent game development studio published on NEXORA.',
        createdAt: new Date().toISOString()
      };
    });
  }

  private checkWishlist(gameId: string): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.isWishlisted = false;
      return;
    }
    this.wishlistData.isWishlisted(user.id, gameId).subscribe(inWishlist => {
      this.isWishlisted = inWishlist;
    });
  }

  private checkOwnership(gameId: string): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.isOwned = false;
      return;
    }
    if (this.isCreatorOwner) {
      this.isOwned = true;
      return;
    }
    this.libraryData.isOwned(user.id, gameId).subscribe(owned => {
      this.isOwned = owned;
    });
  }

  toggleWishlist(): void {
    if (!this.game) return;
    const user = this.authService.currentUser();
    if (!user) {
      this.onLoginRequired();
      return;
    }

    if (this.isWishlisted) {
      this.showWishlistRemoveModal = true;
    } else {
      this.wishlistData.addToWishlist(user.id, this.game.id).subscribe(() => {
        this.isWishlisted = true;
      });
    }
  }

  confirmRemoveFromWishlist(): void {
    if (!this.game) return;
    const user = this.authService.currentUser();
    if (!user) return;

    this.wishlistData.removeFromWishlist(user.id, this.game.id).subscribe(() => {
      this.isWishlisted = false;
      this.showWishlistRemoveModal = false;
    });
  }

  cancelRemoveFromWishlist(): void {
    this.showWishlistRemoveModal = false;
  }

  onLoginRequired(): void {
    if (!this.game) return;
    this.router.navigate(['/login'], { queryParams: { returnUrl: `/games/${this.game.id}` } });
  }

  onDownload(): void {
    if (!this.game) return;
    const user = this.authService.currentUser();
    if (!user) {
      this.onLoginRequired();
      return;
    }

    if (this.isOwned) {
      this.downloadService.downloadGameFile(this.game, this.selectedDownloadPlatform);
      return;
    }

    // Free game direct acquisition
    if (this.game.price === 0) {
      this.libraryData.addToLibrary(user.id, this.game.id).subscribe(() => {
        this.isOwned = true;
        this.downloadService.downloadGameFile(this.game!, this.selectedDownloadPlatform);
      });
    }
  }

  claimFreeToLibrary(): void {
    if (!this.game) return;
    const user = this.authService.currentUser();
    if (!user) {
      this.onLoginRequired();
      return;
    }

    this.libraryData.addToLibrary(user.id, this.game.id).subscribe(() => {
      this.isOwned = true;
      this.showFreeClaimToast = true;
      if (this.isWishlisted) {
        this.wishlistData.removeFromWishlist(user.id, this.game!.id).subscribe(() => {
          this.isWishlisted = false;
        });
      }
      setTimeout(() => {
        this.showFreeClaimToast = false;
      }, 4500);
    });
  }

  promptRemoveFromLibrary(): void {
    this.showLibraryRemoveModal = true;
  }

  confirmRemoveFromLibrary(): void {
    if (!this.game) return;
    const user = this.authService.currentUser();
    if (!user) return;

    this.libraryData.removeFromLibrary(user.id, this.game.id).subscribe(() => {
      this.isOwned = false;
      this.showLibraryRemoveModal = false;
    });
  }

  cancelRemoveFromLibrary(): void {
    this.showLibraryRemoveModal = false;
  }

  removeFromLibrary(): void {
    this.promptRemoveFromLibrary();
  }

  onPurchaseConfirmed(): void {
    if (this.isCreatorOwner) {
      this.openCreatorNoticeModal();
      return;
    }
    this.showPurchaseModal = true;
  }

  onModalConfirm(event?: PurchaseConfirmationEvent): void {
    if (!this.game) return;
    const user = this.authService.currentUser();
    if (!user) {
      this.showPurchaseModal = false;
      this.onLoginRequired();
      return;
    }

    const paymentMethod = event?.paymentMethod || 'Credit Card (Visa •••• 4242)';
    this.purchaseProcessing = true;
    this.ordersData.createOrder(user.id, this.game.id, this.game.price, paymentMethod).subscribe({
      next: (order) => {
        this.libraryData.addToLibrary(user.id, this.game!.id, order.id).subscribe({
          next: () => {
            this.isOwned = true;
            this.purchaseProcessing = false;
            this.showPurchaseModal = false;
            this.confirmedOrder = order;
            this.showOrderConfirmedModal = true;
            if (this.isWishlisted) {
              this.wishlistData.removeFromWishlist(user.id, this.game!.id).subscribe(() => {
                this.isWishlisted = false;
              });
            }
            this.downloadService.downloadGameFile(this.game!, this.selectedDownloadPlatform);
          },
          error: () => {
            this.purchaseProcessing = false;
          }
        });
      },
      error: () => {
        this.purchaseProcessing = false;
      }
    });
  }

  closeOrderConfirmedModal(): void {
    this.showOrderConfirmedModal = false;
  }

  goToLibrary(): void {
    this.showOrderConfirmedModal = false;
    this.router.navigate(['/library']);
  }

  goToOrders(): void {
    this.showOrderConfirmedModal = false;
    this.router.navigate(['/orders']);
  }

  onModalCancel(): void {
    this.showPurchaseModal = false;
    this.purchaseProcessing = false;
  }

  // Lightbox Modal Controls & Keyboard Accessibility
  openLightbox(index: number): void {
    this.activeScreenshotIndex = index;
    this.lightboxActive = true;
  }

  closeLightbox(): void {
    this.lightboxActive = false;
  }

  nextScreenshot(): void {
    if (this.galleryImages.length === 0) return;
    this.activeScreenshotIndex = (this.activeScreenshotIndex + 1) % this.galleryImages.length;
  }

  prevScreenshot(): void {
    if (this.galleryImages.length === 0) return;
    this.activeScreenshotIndex = (this.activeScreenshotIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
  }

  handleStageKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openLightbox(this.selectedStageIndex);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    if (!this.lightboxActive) return;

    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowRight') {
      this.nextScreenshot();
    } else if (event.key === 'ArrowLeft') {
      this.prevScreenshot();
    }
  }
}

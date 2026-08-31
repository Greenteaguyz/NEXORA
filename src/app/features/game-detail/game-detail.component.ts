import { Component, inject, OnInit, OnDestroy, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { Game } from '../../core/models/game.model';
import { User } from '../../core/models/user.model';
import { Order } from '../../core/models/order.model';
import { GAMES_DATA, USERS_DATA, WISHLIST_DATA, LIBRARY_DATA, ORDERS_DATA, PAYMENTS_DATA, FinanceWallet } from '../../core/data/tokens';
import { of } from 'rxjs';
import { formatUsd } from '../../core/data/payments/payment-logic';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { DownloadService } from '../../core/services/download.service';
import { ToastService } from '../../core/services/toast.service';
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
export class GameDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(Title);
  private meta = inject(Meta);
  private gamesData = inject(GAMES_DATA);
  private usersData = inject(USERS_DATA);
  private toastService = inject(ToastService);
  private wishlistData = inject(WISHLIST_DATA);
  private libraryData = inject(LIBRARY_DATA);
  private ordersData = inject(ORDERS_DATA);
  private paymentsData = inject(PAYMENTS_DATA);
  private downloadService = inject(DownloadService);
  authService = inject(AuthService);

  game: Game | null = null;
  creator: User | null = null;
  loading = true;
  loadError = false;
  private currentGameId: string | null = null;
  isWishlisted = false;
  isOwned = false;

  // Purchase & Creator Modal State
  showPurchaseModal = false;
  purchaseProcessing = false;
  claiming = false;
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
    this.loadError = false;
    this.currentGameId = id;
    this.selectedStageIndex = 0;
    this.activeScreenshotIndex = 0;
    this.selectedOs = 'windows';
    this.selectedSpecsTab = 'minimum';
    let intentHandled = false;
    this.gamesData.getGameById(id).subscribe({
      next: game => {
        if (!game) {
          // Unknown id: return the user to the catalog with explicit
          // feedback (reason param drives the shell toast, Phase 1 pipeline).
          this.title.setTitle('Game Details — NEXORA');
          this.clearOgTags();
          this.loading = true;
          this.router.navigate(['/catalog'], {
            queryParams: { reason: 'game-not-found' },
            replaceUrl: true
          });
          return;
        }

        this.game = game;
        this.loadCreator(game.ownerId);
        this.checkWishlist(game.id);
        this.checkOwnership(game.id);
        this.loading = false;

        this.title.setTitle(`${game.title} — NEXORA`);
        this.updateMetaTags(game);

        if (!intentHandled) {
          intentHandled = true;
          this.handleIntentParam(game);
        }
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
        this.game = null;
        this.title.setTitle('Game Details — NEXORA');
        this.clearOgTags();
      }
    });
  }

  retryLoad(): void {
    if (this.currentGameId) {
      this.loadGame(this.currentGameId);
    }
  }

  private updateMetaTags(game: Game): void {
    const description = game.description.length > 160
      ? game.description.slice(0, 157) + '...'
      : game.description;
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: game.title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: game.coverImageUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  private clearOgTags(): void {
    this.meta.removeTag("property='og:title'");
    this.meta.removeTag("property='og:description'");
    this.meta.removeTag("property='og:image'");
    this.meta.removeTag("property='og:type'");
  }

  private handleIntentParam(game: Game): void {
    const intent = this.route.snapshot.queryParamMap.get('intent');
    if (!intent) {
      return;
    }

    if (intent === 'purchase') {
      if (game.price > 0 && !this.isOwned && !this.isCreatorOwner) {
        this.showPurchaseModal = true;
      }
    } else if (intent === 'download') {
      if (this.isOwned) {
        this.onDownload();
      } else {
        this.toastService.show({ type: 'info', title: 'Not in Library', message: 'Get the game first, then download it here.' });
      }
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { intent: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    }).then(() => {
      // The strip navigation re-applies the static route title; re-assert
      // the dynamic game title so deep links keep the correct document title.
      this.title.setTitle(`${game.title} — NEXORA`);
    });
  }

  ngOnDestroy(): void {
    this.clearOgTags();
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
      this.wishlistData.addToWishlist(user.id, this.game.id).subscribe({
        next: () => {
          this.isWishlisted = true;
          this.toastService.show({
            type: 'success',
            title: 'Added to Wishlist',
            message: `"${this.game?.title}" was added to your wishlist.`
          });
        },
        error: () => {
          this.toastService.show({
            type: 'error',
            title: 'Wishlist Update Failed',
            message: 'Could not update your wishlist. Please try again.'
          });
        }
      });
    }
  }

  confirmRemoveFromWishlist(): void {
    if (!this.game) return;
    const user = this.authService.currentUser();
    if (!user) return;

    const gameRef = this.game;
    this.wishlistData.removeFromWishlist(user.id, gameRef.id).subscribe({
      next: () => {
        this.isWishlisted = false;
        this.showWishlistRemoveModal = false;
        this.toastService.show({
          type: 'warning',
          title: 'Removed from Wishlist',
          message: `"${gameRef.title}" was removed from your wishlist.`,
          action: {
            label: 'Undo',
            run: () => this.undoRemoveWishlist(user.id, gameRef.id, gameRef.title)
          }
        });
      },
      error: () => {
        this.showWishlistRemoveModal = false;
        this.toastService.show({
          type: 'error',
          title: 'Wishlist Update Failed',
          message: 'Could not update your wishlist. Please try again.'
        });
      }
    });
  }

  undoRemoveWishlist(userId: string, gameId: string, gameTitle: string): void {
    this.wishlistData.addToWishlist(userId, gameId).subscribe({
      next: () => {
        if (this.game?.id === gameId) {
          this.isWishlisted = true;
        }
        this.toastService.show({
          type: 'success',
          title: 'Restored to Wishlist',
          message: `"${gameTitle}" was restored to your wishlist.`
        });
      }
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
      if (this.claiming) return;
      this.claiming = true;
      this.libraryData.addToLibrary(user.id, this.game.id).subscribe({
        next: () => {
          this.claiming = false;
          this.isOwned = true;
          this.toastService.show({ type: 'success', title: 'Added to Library', message: `${this.game!.title} is now in your library.` });
          // Wishlist-to-library sync: a failed cleanup must not fail the claim.
          if (this.isWishlisted) {
            this.wishlistData.removeFromWishlist(user.id, this.game!.id).subscribe({
              next: () => { this.isWishlisted = false; },
              error: () => { /* non-fatal */ }
            });
          }
          this.downloadService.downloadGameFile(this.game!, this.selectedDownloadPlatform);
        },
        error: () => {
          this.claiming = false;
          this.toastService.show({ type: 'error', title: 'Claim Failed', message: 'Could not add this game to your library. Please try again.' });
        }
      });
    }
  }

  claimFreeToLibrary(): void {
    if (!this.game || this.claiming) return;
    const user = this.authService.currentUser();
    if (!user) {
      this.onLoginRequired();
      return;
    }

    this.claiming = true;
    this.libraryData.addToLibrary(user.id, this.game.id).subscribe({
      next: () => {
        this.claiming = false;
        this.isOwned = true;
        this.showFreeClaimToast = true;
        // Wishlist-to-library sync (fire-and-forget; failure is non-fatal).
        if (this.isWishlisted) {
          this.wishlistData.removeFromWishlist(user.id, this.game!.id).subscribe(() => {
            this.isWishlisted = false;
          });
        }
        setTimeout(() => {
          this.showFreeClaimToast = false;
        }, 4500);
      },
      error: () => {
        this.claiming = false;
        this.toastService.show({ type: 'error', title: 'Claim Failed', message: 'Could not add this game to your library. Please try again.' });
      }
    });
  }

  promptRemoveFromLibrary(): void {
    this.showLibraryRemoveModal = true;
  }

  confirmRemoveFromLibrary(): void {
    if (!this.game || this.claiming) return;
    const user = this.authService.currentUser();
    if (!user) return;

    this.claiming = true;
    const gameId = this.game.id;

    // Paid purchase? Revert the payment before dropping the entitlement.
    this.ordersData.getOrders(user.id).subscribe(orders => {
      const paidOrder = orders.find(o => o.gameId === gameId && o.status === 'confirmed' && o.price > 0);
      if (!paidOrder) {
        this.proceedRemoveFromLibrary(user.id, gameId, null);
        return;
      }
      const walletTender = paidOrder.paymentMethod?.startsWith('NEXORA Store Wallet') ?? false;
      const refund$: Observable<FinanceWallet | null> = walletTender
        ? this.paymentsData.refundWallet(user.id, Math.round(paidOrder.price * 100), paidOrder.id)
        : of(null);
      refund$.subscribe({
        next: () => {
          this.ordersData.revertOrder(paidOrder.id).subscribe({
            next: () => this.proceedRemoveFromLibrary(user.id, gameId, paidOrder),
            error: () => this.failRemoveFromLibrary()
          });
        },
        error: () => this.failRemoveFromLibrary()
      });
    }, () => this.failRemoveFromLibrary());
  }

  private proceedRemoveFromLibrary(userId: string, gameId: string, refundedOrder: Order | null): void {
    this.libraryData.removeFromLibrary(userId, gameId).subscribe({
      next: () => {
        this.claiming = false;
        this.isOwned = false;
        this.showLibraryRemoveModal = false;
        if (refundedOrder) {
          const walletRefund = refundedOrder.paymentMethod?.startsWith('NEXORA Store Wallet') ?? false;
          this.toastService.show({
            type: 'success',
            title: 'Purchase Reverted',
            message: walletRefund
              ? `${formatUsd(refundedOrder.price)} was refunded to your wallet.`
              : 'The purchase was reverted and the game is no longer owned.'
          });
        } else {
          this.toastService.show({ type: 'success', title: 'Removed from Library', message: `${this.game!.title} was removed from your library.` });
        }
      },
      error: () => this.failRemoveFromLibrary()
    });
  }

  private failRemoveFromLibrary(): void {
    this.claiming = false;
    this.showLibraryRemoveModal = false;
    this.toastService.show({ type: 'error', title: 'Removal Failed', message: 'Could not remove this game from your library. Please try again.' });
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
    if (!this.game || this.purchaseProcessing) return;
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
            this.toastService.show({ type: 'success', title: 'Purchase Complete', message: `${this.game!.title} was added to your library.` });
            if (this.isWishlisted) {
              this.wishlistData.removeFromWishlist(user.id, this.game!.id).subscribe(() => {
                this.isWishlisted = false;
              });
            }
            this.downloadService.downloadGameFile(this.game!, this.selectedDownloadPlatform);
          },
          error: () => {
            this.purchaseProcessing = false;
            this.toastService.show({ type: 'error', title: 'Purchase Failed', message: 'Could not add the game to your library. Please contact support.' });
          }
        });
      },
      error: () => {
        this.purchaseProcessing = false;
        this.showPurchaseModal = false;
        this.toastService.show({ type: 'error', title: 'Purchase Failed', message: 'The payment could not be processed. Please try again.' });
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

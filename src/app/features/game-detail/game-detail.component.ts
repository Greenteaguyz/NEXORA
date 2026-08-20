import { Component, inject, OnInit, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Game } from '../../core/models/game.model';
import { User } from '../../core/models/user.model';
import { GAMES_DATA, USERS_DATA, WISHLIST_DATA, LIBRARY_DATA, ORDERS_DATA } from '../../core/data/tokens';
import { AuthService } from '../../core/auth/auth.service';
import { DownloadService } from '../../core/services/download.service';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { DownloadButtonComponent } from '../../shared/ui/download-button/download-button.component';
import { PurchaseConfirmModalComponent } from '../../shared/ui/purchase-confirm-modal/purchase-confirm-modal.component';

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
    DownloadButtonComponent,
    PurchaseConfirmModalComponent
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

  // Purchase Modal State
  showPurchaseModal = false;
  purchaseProcessing = false;

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

  setDownloadPlatform(platform: 'windows' | 'linux'): void {
    this.selectedDownloadPlatform = platform;
  }

  copyChecksum(): void {
    navigator.clipboard.writeText('a8f4c29188e734190b2847d9c0e5a9f2430198642bb3e721a947d10e83461f90');
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

  selectStageImage(index: number): void {
    this.selectedStageIndex = index;
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

  get keyFeatures(): { icon: string; title: string; desc: string }[] {
    if (!this.game) return [];
    const tags = this.game.tags.map(t => t.toLowerCase());

    if (tags.includes('racing') || tags.includes('arcade')) {
      return [
        { icon: 'speed', title: 'Precision Drift & Physics', desc: 'Anti-gravity vehicle handling, supersonic nitro boosts, and high-G banked turns.' },
        { icon: 'circuits', title: 'Dynamic Megacity Circuits', desc: '12 neon-drenched tracks with dynamic hazards, shortcut routes, and weather.' },
        { icon: 'tuning', title: 'Modular Rig Customization', desc: 'Fine-tune thruster aerodynamics, cooling manifolds, and chassis underglow.' },
        { icon: 'controller', title: 'Full Controller & Deck Support', desc: 'Flawless 60+ FPS performance out of the box with zero launcher bloat.' }
      ];
    }

    if (tags.includes('strategy') || tags.includes('hacking') || tags.includes('tactics')) {
      return [
        { icon: 'strategy', title: 'Turn-Based Infiltration', desc: 'Deploy cyber-agents, hijack automated turrets, and execute silent data exfiltration.' },
        { icon: 'override', title: 'Tactical Neural Overrides', desc: 'Manipulate grid topology, overload biometric sensors, and bypass ICE.' },
        { icon: 'gear', title: 'Synergistic Squad Builds', desc: 'Equip black-market cyberware, custom exploit scripts, and EMP weapons.' },
        { icon: 'offline', title: '100% Offline Single-Player', desc: 'Complete standalone campaign playable anywhere with unencrypted open saves.' }
      ];
    }

    if (tags.includes('rpg') || tags.includes('roguelike') || tags.includes('action')) {
      return [
        { icon: 'combat', title: 'Kinetic Real-Time Combat', desc: 'Fluid melee combos, precision gunplay, and kinetic dash abilities.' },
        { icon: 'world', title: 'Procedural Districts', desc: 'Branching encounters and hidden black markets across dense neon alleyways.' },
        { icon: 'craft', title: '50+ Weapon & Mod Synergies', desc: 'Experiment with unique cybernetic implants and tactical gear sets.' },
        { icon: 'controller', title: 'Seamless Gamepad Controls', desc: 'Responsive controls with full controller vibration and remap support.' }
      ];
    }

    return [
      { icon: 'world', title: 'Handcrafted Indie Experience', desc: 'Atmospheric synthwave art, intricate levels, and rich environmental storytelling.' },
      { icon: 'speed', title: 'Skill-Driven Gameplay', desc: 'Tight, responsive controls designed for both gamepad and keyboard/mouse.' },
      { icon: 'offline', title: 'DRM-Free Standalone Package', desc: 'Download once, keep forever on any drive with zero online check-ins.' }
    ];
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
      this.wishlistData.removeFromWishlist(user.id, this.game.id).subscribe(() => {
        this.isWishlisted = false;
      });
    } else {
      this.wishlistData.addToWishlist(user.id, this.game.id).subscribe(() => {
        this.isWishlisted = true;
      });
    }
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

  onPurchaseConfirmed(): void {
    this.showPurchaseModal = true;
  }

  onModalConfirm(): void {
    if (!this.game) return;
    const user = this.authService.currentUser();
    if (!user) {
      this.showPurchaseModal = false;
      this.onLoginRequired();
      return;
    }

    this.purchaseProcessing = true;
    this.ordersData.createOrder(user.id, this.game.id, this.game.price).subscribe({
      next: (order) => {
        this.libraryData.addToLibrary(user.id, this.game!.id, order.id).subscribe({
          next: () => {
            this.isOwned = true;
            this.purchaseProcessing = false;
            this.showPurchaseModal = false;
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

import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Game } from '../../core/models/game.model';
import { User } from '../../core/models/user.model';
import { GAMES_DATA, USERS_DATA, WISHLIST_DATA } from '../../core/data/tokens';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

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
    EmptyStateComponent
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
  authService = inject(AuthService);

  game: Game | null = null;
  creator: User | null = null;
  loading = true;
  isWishlisted = false;

  // Media Gallery Stage & Lightbox
  selectedStageIndex = 0;
  lightboxActive = false;
  activeScreenshotIndex = 0;

  // System Requirements State
  selectedOs: 'windows' | 'linux' = 'windows';
  selectedSpecsTab: 'minimum' | 'recommended' = 'minimum';

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

  get packageSize(): string {
    if (!this.game) return '1.20 GB';
    if (this.isRetro2D) return '340 MB';
    return '1.84 GB';
  }

  get releaseDate(): string {
    if (!this.game || !this.game.createdAt) return 'Recent Release';
    const d = new Date(this.game.createdAt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  get minimumSpecs(): SpecTier {
    const is2D = this.isRetro2D;
    const isWin = this.selectedOs === 'windows';
    return {
      tierId: 'minimum',
      title: 'Minimum Specs',
      targetBadge: is2D ? '720p @ 60 FPS' : '1080p @ 30 FPS',
      targetDesc: 'Low / Medium Graphics Settings',
      items: [
        {
          icon: 'os',
          label: 'Operating System',
          value: isWin ? 'Windows 10 / 11 (64-bit)' : 'Ubuntu 22.04 LTS / Debian 12 / Arch (glibc 2.35+)'
        },
        {
          icon: 'cpu',
          label: 'Processor (CPU)',
          value: is2D ? 'Intel Core 2 Duo E8400 / AMD Athlon 64 (2.0 GHz)' : 'Intel Core i5-4460 / AMD FX-6300 (Quad-core 3.2 GHz)'
        },
        {
          icon: 'ram',
          label: 'Memory (RAM)',
          value: is2D ? '2 GB High-Speed RAM' : '8 GB Dual-Channel System RAM'
        },
        {
          icon: 'gpu',
          label: 'Graphics (GPU)',
          value: is2D ? 'Intel HD Graphics 4000 (OpenGL 3.0 / Vulkan 1.1)' : 'NVIDIA GeForce GTX 960 (4GB) / AMD Radeon R9 280 (3GB)'
        },
        {
          icon: 'directx',
          label: isWin ? 'DirectX / API' : 'Graphics API',
          value: isWin ? (is2D ? 'DirectX 9.0c Compatible' : 'DirectX 11 or Vulkan 1.2 Compatible') : 'Vulkan 1.2+ / Mesa 22.0+ Native'
        },
        {
          icon: 'storage',
          label: 'Storage Space',
          value: is2D ? '500 MB Available Storage' : '4.5 GB Storage (SSD Recommended)'
        }
      ]
    };
  }

  get recommendedSpecs(): SpecTier {
    const is2D = this.isRetro2D;
    const isWin = this.selectedOs === 'windows';
    return {
      tierId: 'recommended',
      title: 'Recommended Specs',
      targetBadge: is2D ? '1080p @ 60 FPS' : '1440p+ @ 60 FPS',
      targetDesc: 'High / Ultra Ray-Traced Settings',
      items: [
        {
          icon: 'os',
          label: 'Operating System',
          value: isWin ? 'Windows 11 (64-bit latest build)' : 'Arch Linux 6.x / Fedora 40 (Wayland Native)'
        },
        {
          icon: 'cpu',
          label: 'Processor (CPU)',
          value: is2D ? 'Intel Core i3-4130 / AMD Ryzen 3 1200' : 'Intel Core i7-8700K / AMD Ryzen 5 3600X (6 Cores / 12 Threads)'
        },
        {
          icon: 'ram',
          label: 'Memory (RAM)',
          value: is2D ? '4 GB Dual-Channel RAM' : '16 GB Dual-Channel DDR4/DDR5'
        },
        {
          icon: 'gpu',
          label: 'Graphics (GPU)',
          value: is2D ? 'NVIDIA GeForce GT 1030 / AMD Radeon RX 550' : 'NVIDIA GeForce RTX 3060 (8GB) / AMD Radeon RX 6600 XT (8GB)'
        },
        {
          icon: 'directx',
          label: isWin ? 'DirectX / API' : 'Graphics API',
          value: isWin ? (is2D ? 'DirectX 11' : 'DirectX 12 Ultimate (Feature Level 12_2)') : 'Vulkan 1.3 Native / Proton GE Experimental'
        },
        {
          icon: 'storage',
          label: 'Storage Space',
          value: is2D ? '1 GB High-Speed Storage' : '4.5 GB High-Speed NVMe M.2 Solid State Drive'
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

  toggleWishlist(): void {
    if (!this.game) return;
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/games/${this.game.id}` } });
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

  handleActionClick(): void {
    if (!this.game) return;
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/games/${this.game.id}` } });
      return;
    }
    alert(`Acquisition flow for ${this.game.title} (Phase 3 gated download).`);
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

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Game } from '../../core/models/game.model';
import { User } from '../../core/models/user.model';
import { GAMES_DATA, USERS_DATA, WISHLIST_DATA } from '../../core/data/tokens';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

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

  // System Requirements Tab
  selectedSpecsTab: 'minimum' | 'recommended' = 'minimum';

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
      this.creator = user || null;
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

  // Lightbox Modal Controls
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
}


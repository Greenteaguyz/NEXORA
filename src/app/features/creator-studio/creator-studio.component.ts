import { Component, inject, effect, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Game } from '../../core/models/game.model';
import { GAMES_DATA } from '../../core/data/tokens';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ScrollLockDirective } from '../../shared/directives/scroll-lock.directive';

@Component({
  selector: 'app-creator-studio',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    LoadingSpinnerComponent, 
    EmptyStateComponent,
    ScrollLockDirective
  ],
  templateUrl: './creator-studio.component.html',
  styleUrls: ['./creator-studio.component.css']
})
export class CreatorStudioComponent implements OnInit {
  private gamesData = inject(GAMES_DATA);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  games: Game[] = [];
  loading = true;

  // Soft-Delete Modal State
  gameToDelete: Game | null = null;
  deleting = false;
  deleteSuccess = false;

  // Publish / Update Celebratory Toast State (AC-1118)
  showPublishToast = false;
  publishToastTitle = '';
  publishToastMode: 'published' | 'updated' = 'published';
  publishedGameId: string | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.gameToDelete = null;
      this.loadStudioGames(user);
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['published'] === 'true' && params['title']) {
        this.publishToastTitle = params['title'];
        this.publishToastMode = 'published';
        this.publishedGameId = params['gameId'] || null;
        this.showPublishToast = true;
      } else if (params['updated'] === 'true' && params['title']) {
        this.publishToastTitle = params['title'];
        this.publishToastMode = 'updated';
        this.publishedGameId = params['gameId'] || null;
        this.showPublishToast = true;
      }
    });
  }

  closePublishToast(): void {
    this.showPublishToast = false;
  }

  loadStudioGames(user = this.auth.currentUser()): void {
    if (!user) {
      this.games = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.gamesData.getGamesByOwnerId(user.id).subscribe({
      next: (list) => {
        this.games = list;
        this.loading = false;
      },
      error: () => {
        this.games = [];
        this.loading = false;
      }
    });
  }

  get activeGamesCount(): number {
    return this.games.filter(g => !g.deletedAt).length;
  }

  get unpublishedGamesCount(): number {
    return this.games.filter(g => !!g.deletedAt).length;
  }

  get catalogValue(): number {
    return this.games.filter(g => !g.deletedAt).reduce((sum, g) => sum + g.price, 0);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  openDeleteModal(game: Game, event: MouseEvent): void {
    event.stopPropagation();
    this.gameToDelete = game;
  }

  closeDeleteModal(): void {
    if (this.deleting) return;
    this.gameToDelete = null;
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.gameToDelete) {
      this.closeDeleteModal();
    }
  }

  confirmSoftDelete(): void {
    if (!this.gameToDelete) return;

    this.deleting = true;
    this.gamesData.deleteGame(this.gameToDelete.id).subscribe({
      next: () => {
        this.deleting = false;
        this.gameToDelete = null;
        this.deleteSuccess = true;
        this.loadStudioGames();
        setTimeout(() => { this.deleteSuccess = false; }, 3500);
      },
      error: () => {
        this.deleting = false;
      }
    });
  }
}

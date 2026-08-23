import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Game } from '../../core/models/game.model';
import { GAMES_DATA } from '../../core/data/tokens';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-creator-studio',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    LoadingSpinnerComponent, 
    EmptyStateComponent
  ],
  templateUrl: './creator-studio.component.html',
  styleUrls: ['./creator-studio.component.css']
})
export class CreatorStudioComponent {
  private gamesData = inject(GAMES_DATA);
  auth = inject(AuthService);
  private router = inject(Router);

  games: Game[] = [];
  loading = true;

  // Soft-Delete Modal State
  gameToDelete: Game | null = null;
  deleting = false;
  deleteSuccess = false;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.gameToDelete = null;
      this.loadStudioGames(user);
    });
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

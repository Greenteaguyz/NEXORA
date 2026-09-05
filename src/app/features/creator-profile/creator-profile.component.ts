import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { User } from '../../core/models/user.model';
import { Game } from '../../core/models/game.model';
import { USERS_DATA, GAMES_DATA } from '../../core/data/tokens';
import { GameCardComponent } from '../../shared/ui/game-card/game-card.component';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

import { RoleBadgeComponent } from '../../shared/ui/role-badge/role-badge.component';

@Component({
  selector: 'app-creator-profile',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    GameCardComponent, 
    LoadingSpinnerComponent, 
    EmptyStateComponent,
    RoleBadgeComponent
  ],
  templateUrl: './creator-profile.component.html',
  styleUrls: ['./creator-profile.component.css']
})
export class CreatorProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private usersData = inject(USERS_DATA);
  private gamesData = inject(GAMES_DATA);

  creator: User | null = null;
  creatorGames: Game[] = [];
  loading = true;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCreatorProfile(id);
      }
    });
  }

  loadCreatorProfile(id: string): void {
    this.loading = true;
    this.usersData.getUser(id).subscribe(user => {
      this.creator = user || null;
      if (user) {
        this.gamesData.getGamesByOwnerId(user.id).subscribe(games => {
          this.creatorGames = games;
          this.loading = false;
        });
      } else {
        this.loading = false;
      }
    });
  }

  get flagshipGame(): Game | null {
    return this.creatorGames.length > 0 ? this.creatorGames[0] : null;
  }

  copiedShareLink = false;

  copyProfileLink(): void {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      this.copiedShareLink = true;
      setTimeout(() => {
        this.copiedShareLink = false;
      }, 2500);
    }
  }
}

import { Component, Input, inject, OnInit, OnChanges, SimpleChanges, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Game } from '../../../core/models/game.model';
import { AuthService } from '../../../core/auth/auth.service';
import { WISHLIST_DATA } from '../../../core/data/tokens';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.css']
})
export class GameCardComponent implements OnInit, OnChanges {
  @Input({ required: true }) game!: Game;

  authService = inject(AuthService);
  private wishlistData = inject(WISHLIST_DATA);
  private router = inject(Router);

  isWishlisted = false;

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.isWishlisted = false;
      } else if (this.game) {
        this.checkWishlistStatus(user.id);
      }
    });
  }

  ngOnInit(): void {
    this.checkWishlistStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['game'] && !changes['game'].firstChange) {
      this.checkWishlistStatus();
    }
  }

  checkWishlistStatus(userId?: string): void {
    const user = this.authService.currentUser();
    const uid = userId || user?.id;
    if (!uid || !this.game) {
      this.isWishlisted = false;
      return;
    }
    this.wishlistData.isWishlisted(uid, this.game.id).subscribe(inWishlist => {
      this.isWishlisted = inWishlist;
    });
  }

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

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
}

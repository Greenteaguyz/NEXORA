import { Component, Input, inject, OnInit, OnChanges, SimpleChanges, effect, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Game } from '../../../core/models/game.model';
import { AuthService } from '../../../core/auth/auth.service';
import { WISHLIST_DATA } from '../../../core/data/tokens';
import { LIBRARY_DATA } from '../../../core/data/tokens';
import { ToastService } from '../../../core/services/toast.service';
import { ScrollLockDirective } from '../../directives/scroll-lock.directive';
import { ContextMenuDirective } from '../context-menu/context-menu.directive';
import { ContextMenuItem } from '../context-menu/context-menu.model';
import { HoverCardDirective } from '../hover-card/hover-card.directive';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollLockDirective, ContextMenuDirective, HoverCardDirective],
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.css']
})
export class GameCardComponent implements OnInit, OnChanges {
  @Input({ required: true }) game!: Game;
  @Input() showCreator = true;

  authService = inject(AuthService);
  private wishlistData = inject(WISHLIST_DATA);
  private libraryData = inject(LIBRARY_DATA);
  private router = inject(Router);
  private readonly toastService = inject(ToastService);
  private translationService = inject(TranslationService);
  t = this.translationService.t;

  isWishlisted = false;
  isOwned = false;

  showRemoveConfirm = signal(false);
  @ViewChild('cardCancelBtn') cardCancelBtn?: ElementRef<HTMLButtonElement>;
  private previouslyFocused: HTMLElement | null = null;

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
    this.checkOwnership();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['game'] && !changes['game'].firstChange) {
      this.checkWishlistStatus();
      this.checkOwnership();
    }
  }

  checkOwnership(): void {
    const user = this.authService.currentUser();
    if (!user || !this.game) {
      this.isOwned = false;
      return;
    }
    this.libraryData.isOwned(user.id, this.game.id).subscribe(owned => {
      this.isOwned = owned;
    });
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
      if (typeof document !== 'undefined') {
        this.previouslyFocused = document.activeElement as HTMLElement | null;
      }
      this.showRemoveConfirm.set(true);
      setTimeout(() => this.cardCancelBtn?.nativeElement.focus(), 0);
      return;
    } else {
      this.wishlistData.addToWishlist(user.id, this.game.id).subscribe({
        next: () => {
          this.isWishlisted = true;
          this.toastService.show({ type: 'success', title: 'Added to Wishlist', message: `${this.game.title} was added to your wishlist.` });
        },
        error: () => {
          this.isWishlisted = false;
          this.toastService.show({ type: 'error', title: 'Wishlist Update Failed', message: 'Could not update your wishlist. Please try again.' });
        }
      });
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showRemoveConfirm()) {
      this.cancelRemove();
    }
  }

  cancelRemove(): void {
    this.showRemoveConfirm.set(false);
    this.restoreFocus();
  }

  confirmRemove(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.cancelRemove();
      return;
    }
    this.wishlistData.removeFromWishlist(user.id, this.game.id).subscribe({
      next: () => {
        this.isWishlisted = false;
        this.toastService.show({ type: 'warning', title: 'Removed from Wishlist', message: `${this.game.title} was removed from your wishlist.`, action: { label: 'Undo', run: () => this.undoRemove() } });
        this.showRemoveConfirm.set(false);
        this.restoreFocus();
      },
      error: () => {
        this.isWishlisted = true;
        this.toastService.show({ type: 'error', title: 'Wishlist Update Failed', message: 'Could not update your wishlist. Please try again.' });
        this.showRemoveConfirm.set(false);
        this.restoreFocus();
      }
    });
  }

  private undoRemove(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.toastService.show({ type: 'error', title: 'Sign In Required', message: 'Sign in to restore this game to your wishlist.' });
      return;
    }
    this.wishlistData.addToWishlist(user.id, this.game.id).subscribe({
      next: () => {
        this.isWishlisted = true;
        this.toastService.show({ type: 'success', title: 'Restored to Wishlist', message: `${this.game.title} is back in your wishlist.` });
      },
      error: () => {
        this.toastService.show({ type: 'error', title: 'Wishlist Update Failed', message: 'Could not restore this game. Please try again.' });
      }
    });
  }

  get contextMenuItems(): ContextMenuItem[] {
    if (!this.game) return [];

    const items: ContextMenuItem[] = [
      {
        id: 'view-store',
        label: 'View Store Page',
        action: () => this.router.navigate(['/games', this.game.id])
      },
      {
        id: 'wishlist-toggle',
        label: this.isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist',
        danger: this.isWishlisted,
        action: () => this.toggleWishlistDirect()
      },
      {
        id: 'copy-link',
        label: 'Copy Store Link',
        action: () => this.copyStoreLink()
      }
    ];

    if (this.isOwned) {
      items.unshift({
        id: 'play-game',
        label: 'Play Game',
        action: () => this.router.navigate(['/library'])
      });
    }

    return items;
  }

  copyStoreLink(): void {
    if (!this.game) return;
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const url = `${window.location.origin}/games/${this.game.id}`;
      navigator.clipboard.writeText(url).then(() => {
        this.toastService.show({
          type: 'info',
          title: 'Link Copied',
          message: `Store link for "${this.game.title}" copied to clipboard.`
        });
      }).catch(() => {
        this.toastService.show({
          type: 'info',
          title: 'Store Link',
          message: `/games/${this.game.id}`
        });
      });
    }
  }

  toggleWishlistDirect(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/games/${this.game.id}` } });
      return;
    }
    if (this.isWishlisted) {
      this.confirmRemove();
    } else {
      this.wishlistData.addToWishlist(user.id, this.game.id).subscribe({
        next: () => {
          this.isWishlisted = true;
          this.toastService.show({
            type: 'success',
            title: 'Added to Wishlist',
            message: `${this.game.title} was added to your wishlist.`
          });
        }
      });
    }
  }

  private restoreFocus(): void {
    if (this.previouslyFocused && typeof this.previouslyFocused.focus === 'function' &&
        typeof document !== 'undefined' && document.contains(this.previouslyFocused)) {
      this.previouslyFocused.focus();
    }
    this.previouslyFocused = null;
  }
}

import { Injectable, signal, inject, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Game } from '../models/game.model';
import { HoverCardPosition } from '../../shared/ui/hover-card/hover-card.model';
import { calculateHoverCardPosition, BoundingRectLike } from '../../shared/ui/hover-card/hover-card-position.util';

@Injectable({
  providedIn: 'root'
})
export class HoverCardService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router, { optional: true });
  private destroyRef = inject(DestroyRef);

  isOpen = signal<boolean>(false);
  activeGame = signal<Game | null>(null);
  position = signal<HoverCardPosition>({ top: 0, left: 0, placement: 'right' });

  private openTimer: any = null;
  private readonly HOVER_DELAY_MS = 300;

  constructor() {
    if (this.router) {
      this.router.events
        .pipe(
          filter((event): event is NavigationStart => event instanceof NavigationStart),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.close();
        });
    }

    if (isPlatformBrowser(this.platformId)) {
      const dismissOnScroll = () => {
        if (this.isOpen() || this.openTimer) {
          this.close();
        }
      };
      window.addEventListener('scroll', dismissOnScroll, { passive: true });
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', dismissOnScroll);
      });
    }
  }

  scheduleOpen(game: Game, targetRect: BoundingRectLike): void {
    this.cancelOpen();

    if (!isPlatformBrowser(this.platformId)) return;

    this.openTimer = setTimeout(() => {
      const cardWidth = 320;
      const cardHeight = 280;
      const pos = calculateHoverCardPosition(
        targetRect,
        cardWidth,
        cardHeight,
        window.innerWidth,
        window.innerHeight,
        12,
        10
      );

      this.activeGame.set(game);
      this.position.set(pos);
      this.isOpen.set(true);
    }, this.HOVER_DELAY_MS);
  }

  cancelOpen(): void {
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }

  close(): void {
    this.cancelOpen();
    this.isOpen.set(false);
    this.activeGame.set(null);
  }
}

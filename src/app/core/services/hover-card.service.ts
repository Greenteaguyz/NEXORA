import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Game } from '../models/game.model';
import { HoverCardPosition } from '../../shared/ui/hover-card/hover-card.model';
import { calculateHoverCardPosition, BoundingRectLike } from '../../shared/ui/hover-card/hover-card-position.util';

@Injectable({
  providedIn: 'root'
})
export class HoverCardService {
  private platformId = inject(PLATFORM_ID);

  isOpen = signal<boolean>(false);
  activeGame = signal<Game | null>(null);
  position = signal<HoverCardPosition>({ top: 0, left: 0, placement: 'right' });

  private openTimer: any = null;
  private readonly HOVER_DELAY_MS = 300;

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

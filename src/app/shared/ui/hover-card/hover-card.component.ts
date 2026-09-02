import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Game } from '../../../core/models/game.model';
import { HoverCardPosition } from './hover-card.model';

@Component({
  selector: 'app-hover-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hover-card.component.html',
  styleUrls: ['./hover-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HoverCardComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) game!: Game;
  @Input({ required: true }) position: HoverCardPosition = { top: 0, left: 0, placement: 'right' };

  private platformId = inject(PLATFORM_ID);
  activeScreenshotIndex = signal<number>(0);
  private cycleTimer: any = null;

  ngOnInit(): void {
    this.startScreenshotCycle();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['game'] && !changes['game'].firstChange) {
      this.activeScreenshotIndex.set(0);
      this.startScreenshotCycle();
    }
  }

  ngOnDestroy(): void {
    this.stopScreenshotCycle();
  }

  get currentScreenshot(): string {
    if (!this.game) return 'assets/logo-icon.svg';
    const shots = this.game.screenshotUrls || [];
    if (shots.length === 0) return this.game.coverImageUrl || 'assets/logo-icon.svg';
    return shots[this.activeScreenshotIndex() % shots.length] || this.game.coverImageUrl;
  }

  private startScreenshotCycle(): void {
    this.stopScreenshotCycle();
    if (!isPlatformBrowser(this.platformId) || !this.game?.screenshotUrls?.length) return;

    this.cycleTimer = setInterval(() => {
      const total = this.game.screenshotUrls.length;
      if (total > 1) {
        this.activeScreenshotIndex.update(idx => (idx + 1) % total);
      }
    }, 2500);
  }

  private stopScreenshotCycle(): void {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
  }
}

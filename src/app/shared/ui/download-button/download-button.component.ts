import { Component, Input, Output, EventEmitter, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Game } from '../../../core/models/game.model';
import { AuthService } from '../../../core/auth/auth.service';

export type DownloadButtonPhase = 'idle' | 'downloading' | 'verifying' | 'completed';

@Component({
  selector: 'app-download-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './download-button.component.html',
  styleUrls: ['./download-button.component.css']
})
export class DownloadButtonComponent {
  @Input({ required: true }) game!: Game;
  @Input({ required: true }) isOwned!: boolean;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullWidth = false;
  @Input() platform: 'windows' | 'linux' = 'windows';

  @Output() download = new EventEmitter<void>();
  @Output() loginRequired = new EventEmitter<void>();
  @Output() purchaseConfirmed = new EventEmitter<void>();

  private auth = inject(AuthService);

  // Active progress animation state
  downloadPhase = signal<DownloadButtonPhase>('idle');
  progressPercent = signal<number>(0);
  downloadSpeed = signal<string>('68 MB/s');

  isDeleted = computed(() => !!this.game?.deletedAt);
  isLoggedIn = computed(() => this.auth.currentUser() !== null);
  isFree = computed(() => (this.game?.price ?? 0) === 0);

  buttonState = computed<'anonymous' | 'free_unowned' | 'paid_unowned' | 'owned' | 'unavailable'>(() => {
    if (this.isDeleted()) return 'unavailable';
    if (this.isOwned) return 'owned';
    if (!this.isLoggedIn()) return 'anonymous';
    if (this.isFree()) return 'free_unowned';
    return 'paid_unowned';
  });

  displayLabel = computed(() => {
    const phase = this.downloadPhase();
    if (phase === 'downloading') {
      return `Downloading ${this.progressPercent()}% (${this.downloadSpeed()})`;
    }
    if (phase === 'verifying') {
      return 'Verifying SHA-256...';
    }
    if (phase === 'completed') {
      return 'Download Complete!';
    }

    switch (this.buttonState()) {
      case 'unavailable':
        return 'Unavailable';
      case 'owned':
        return 'Download';
      case 'anonymous':
        return 'Download';
      case 'free_unowned':
        return 'Download Free';
      case 'paid_unowned':
        return `Buy $${(this.game?.price ?? 0).toFixed(2)}`;
    }
  });

  buttonClass = computed(() => {
    const state = this.buttonState();
    const phase = this.downloadPhase();
    const sizeClass = `btn-${this.size}`;
    const widthClass = this.fullWidth ? 'btn-full' : '';
    const phaseClass = phase !== 'idle' ? `phase-${phase}` : '';

    let themeClass = 'btn-primary';
    if (state === 'unavailable') {
      themeClass = 'btn-unavailable';
    } else if (state === 'paid_unowned' && phase === 'idle') {
      themeClass = 'btn-buy';
    } else if (state === 'owned' || state === 'free_unowned' || phase !== 'idle') {
      themeClass = 'btn-download';
    }

    return `nexora-download-btn ${sizeClass} ${themeClass} ${widthClass} ${phaseClass}`.trim();
  });

  handleClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isDeleted()) return;
    if (this.downloadPhase() !== 'idle') return; // Prevent double click while downloading

    if (!this.isLoggedIn()) {
      this.loginRequired.emit();
      return;
    }

    if (this.isOwned || this.isFree()) {
      this.startInteractiveDownload();
      return;
    }

    this.purchaseConfirmed.emit();
  }

  private startInteractiveDownload(): void {
    this.downloadPhase.set('downloading');
    this.progressPercent.set(12);

    const step1 = setTimeout(() => {
      this.progressPercent.set(45);
      this.downloadSpeed.set('74 MB/s');
    }, 200);

    const step2 = setTimeout(() => {
      this.progressPercent.set(82);
      this.downloadSpeed.set('81 MB/s');
    }, 450);

    const step3 = setTimeout(() => {
      this.downloadPhase.set('verifying');
      this.progressPercent.set(98);
    }, 700);

    const step4 = setTimeout(() => {
      this.downloadPhase.set('completed');
      this.progressPercent.set(100);
      this.download.emit();
    }, 950);

    // Auto-reset back to idle after 3.5 seconds
    const reset = setTimeout(() => {
      this.downloadPhase.set('idle');
      this.progressPercent.set(0);
    }, 3500);
  }
}

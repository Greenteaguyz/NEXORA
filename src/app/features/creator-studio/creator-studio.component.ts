import { Component, inject, effect, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Game } from '../../core/models/game.model';
import { GAMES_DATA, ORDERS_DATA } from '../../core/data/tokens';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { ToastService } from '../../core/services/toast.service';
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
export class CreatorStudioComponent implements OnInit, OnDestroy {
  private gamesData = inject(GAMES_DATA);
  private ordersData = inject(ORDERS_DATA, { optional: true });
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  auth = inject(AuthService);
  private toast = inject(ToastService);

  games: Game[] = [];
  loading = true;
  totalRevenue = 0;
  unitsSold = 0;

  // View Filter Tabs
  activeTab = signal<'all' | 'active' | 'drafts' | 'bin'>('all');

  // Stage 1: Move to Recycle Bin Modal State
  gameToBin: Game | null = null;
  deleting = false;

  // Stage 2: Permanent Purge Modal State
  gameToPurge: Game | null = null;
  purging = false;
  readonly purgeCountdownTotal = 5;
  purgeCountdownSeconds = 5;
  private purgeCountdownTimerId: ReturnType<typeof setInterval> | null = null;

  get purgeCountdownProgressPercent(): number {
    return Math.max(0, Math.min(100, ((this.purgeCountdownTotal - this.purgeCountdownSeconds) / this.purgeCountdownTotal) * 100));
  }

  // Quick Action State
  busyGameIds = new Set<string>();

  // Publish / Update Celebratory Banner State
  showPublishToast = false;
  publishToastTitle = '';
  publishToastMode: 'published' | 'updated' | 'draft' = 'published';
  publishedGameId: string | null = null;
  readonly TOAST_AUTO_DISMISS_MS = 5500;
  private publishToastTimer: ReturnType<typeof setTimeout> | null = null;
  private toastDismissStartTime = 0;
  private toastRemainingMs = 5500;
  private isToastPaused = false;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.gameToBin = null;
      this.gameToPurge = null;
      this.loadStudioGames(user);
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      let shouldShow = false;
      if (params['published'] === 'true' && params['title']) {
        this.publishToastTitle = params['title'];
        this.publishToastMode = 'published';
        this.publishedGameId = params['gameId'] || null;
        shouldShow = true;
      } else if (params['updated'] === 'true' && params['title']) {
        this.publishToastTitle = params['title'];
        this.publishToastMode = 'updated';
        this.publishedGameId = params['gameId'] || null;
        shouldShow = true;
      } else if (params['draftSaved'] === 'true' && params['title']) {
        this.publishToastTitle = params['title'];
        this.publishToastMode = 'draft';
        this.publishedGameId = params['gameId'] || null;
        shouldShow = true;
        this.activeTab.set('drafts');
      }

      if (shouldShow) {
        this.showPublishToast = true;
        this.startPublishToastTimer(this.TOAST_AUTO_DISMISS_MS);
        // Clean URL query parameters to avoid resurrection on refresh
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  startPublishToastTimer(durationMs = this.TOAST_AUTO_DISMISS_MS): void {
    this.clearPublishToastTimer();
    this.toastRemainingMs = durationMs;
    this.toastDismissStartTime = Date.now();
    this.isToastPaused = false;
    this.publishToastTimer = setTimeout(() => {
      this.closePublishToast();
    }, durationMs);
  }

  pausePublishToastTimer(): void {
    if (!this.showPublishToast || this.isToastPaused || !this.publishToastTimer) return;
    this.clearPublishToastTimer();
    const elapsed = Date.now() - this.toastDismissStartTime;
    this.toastRemainingMs = Math.max(1000, this.toastRemainingMs - elapsed);
    this.isToastPaused = true;
  }

  resumePublishToastTimer(): void {
    if (!this.showPublishToast || !this.isToastPaused) return;
    this.startPublishToastTimer(this.toastRemainingMs);
  }

  clearPublishToastTimer(): void {
    if (this.publishToastTimer) {
      clearTimeout(this.publishToastTimer);
      this.publishToastTimer = null;
    }
  }

  setTab(tab: 'all' | 'active' | 'drafts' | 'bin'): void {
    this.activeTab.set(tab);
  }

  closePublishToast(): void {
    this.clearPublishToastTimer();
    this.showPublishToast = false;
    this.isToastPaused = false;
  }

  ngOnDestroy(): void {
    this.clearPublishToastTimer();
    this.clearPurgeCountdownTimer();
  }

  loadStudioGames(user = this.auth.currentUser()): void {
    if (!user) {
      this.games = [];
      this.loading = false;
      this.totalRevenue = 0;
      return;
    }

    this.loading = true;
    this.gamesData.getGamesByOwnerId(user.id).subscribe({
      next: (list) => {
        this.games = list;
        this.loading = false;
        this.calculateRevenue(user.id);
      },
      error: () => {
        this.games = [];
        this.loading = false;
        this.totalRevenue = 0;
      }
    });
  }

  private calculateRevenue(ownerId: string): void {
    if (!this.ordersData || !this.ordersData.getAllOrders) {
      // Fallback: Alice starts with Marvel Rivals seed order $4.99 * 0.90 = $4.49
      this.totalRevenue = ownerId === 'usr_alice' ? 4.49 : 0;
      this.unitsSold = ownerId === 'usr_alice' ? 1 : 0;
      return;
    }

    this.ordersData.getAllOrders().subscribe({
      next: (allOrders) => {
        const ownerGameIds = new Set(this.games.map(g => g.id));
        const confirmedOrders = allOrders.filter(o => ownerGameIds.has(o.gameId) && o.status === 'confirmed');
        const gross = confirmedOrders.reduce((sum, o) => sum + (o.price || 0), 0);
        this.totalRevenue = Math.round(gross * 0.90 * 100) / 100;
        this.unitsSold = confirmedOrders.length;
      },
      error: () => {
        this.totalRevenue = 0;
        this.unitsSold = 0;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Metric Calculations
  // ---------------------------------------------------------------------------
  get activeGamesCount(): number {
    return this.games.filter(g => !g.deletedAt && g.status !== 'draft').length;
  }

  get draftGamesCount(): number {
    return this.games.filter(g => !g.deletedAt && g.status === 'draft').length;
  }

  get binGamesCount(): number {
    return this.games.filter(g => !!g.deletedAt).length;
  }

  get catalogValue(): number {
    return this.games
      .filter(g => !g.deletedAt && g.status !== 'draft')
      .reduce((sum, g) => sum + (g.price || 0), 0);
  }

  get filteredGames(): Game[] {
    const tab = this.activeTab();
    switch (tab) {
      case 'active':
        return this.games.filter(g => !g.deletedAt && g.status !== 'draft');
      case 'drafts':
        return this.games.filter(g => !g.deletedAt && g.status === 'draft');
      case 'bin':
        return this.games.filter(g => !!g.deletedAt);
      case 'all':
      default:
        return this.games.filter(g => !g.deletedAt);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  isGameBusy(gameId: string): boolean {
    return this.busyGameIds.has(gameId);
  }

  // ---------------------------------------------------------------------------
  // Stage 1: Move to Recycle Bin Confirmation Modal & Miss-Click Undo
  // ---------------------------------------------------------------------------
  openDeleteModal(game: Game, event: MouseEvent): void {
    event.stopPropagation();
    this.gameToBin = game;
  }

  closeDeleteModal(): void {
    if (this.deleting) return;
    this.gameToBin = null;
  }

  confirmMoveToBin(): void {
    if (!this.gameToBin) return;

    const targetGame = { ...this.gameToBin };
    this.deleting = true;

    this.gamesData.deleteGame(targetGame.id).subscribe({
      next: () => {
        this.deleting = false;
        this.gameToBin = null;
        this.loadStudioGames();

        // Layer 2: 8-second quick Undo toast alert with interactive button
        const isDraft = targetGame.status === 'draft';
        this.toast.show({
          type: 'info',
          title: isDraft ? 'Draft Deleted' : 'Moved to Recycle Bin',
          message: `"${targetGame.title}" was moved to the Recycle Bin.`,
          action: {
            label: 'Undo',
            run: () => {
              this.restoreFromBin(targetGame);
            }
          }
        }, 8000);
      },
      error: () => {
        this.deleting = false;
        this.toast.show({ type: 'error', title: 'Action Failed', message: 'Could not remove listing. Please try again.' });
      }
    });
  }

  restoreFromBin(game: Game, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.isGameBusy(game.id)) return;
    if (!this.gamesData.restoreGame) return;

    this.busyGameIds.add(game.id);
    this.gamesData.restoreGame(game.id).subscribe({
      next: () => {
        this.busyGameIds.delete(game.id);
        this.loadStudioGames();
        this.toast.show({
          type: 'success',
          title: 'Restored',
          message: `"${game.title}" was restored successfully.`
        });
      },
      error: () => {
        this.busyGameIds.delete(game.id);
        this.toast.show({ type: 'error', title: 'Restore Failed', message: 'Could not restore this listing.' });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Stage 2: Permanent Deletion Modal & Batch Empty Bin
  // ---------------------------------------------------------------------------
  openPurgeModal(game: Game, event: MouseEvent): void {
    event.stopPropagation();
    this.clearPurgeCountdownTimer();
    this.purgeCountdownSeconds = this.purgeCountdownTotal;
    this.gameToPurge = game;

    this.purgeCountdownTimerId = setInterval(() => {
      if (this.purgeCountdownSeconds > 0) {
        this.purgeCountdownSeconds = Math.max(0, this.purgeCountdownSeconds - 1);
      } else {
        // Stop countdown at 0 — DO NOT auto-dismiss or auto-execute! Keep modal open for user confirmation.
        this.clearPurgeCountdownTimer();
      }
    }, 1000);
  }

  closePurgeModal(): void {
    if (this.purging) return;
    this.clearPurgeCountdownTimer();
    this.gameToPurge = null;
  }

  clearPurgeCountdownTimer(): void {
    if (this.purgeCountdownTimerId) {
      clearInterval(this.purgeCountdownTimerId);
      this.purgeCountdownTimerId = null;
    }
  }

  confirmPermanentDelete(): void {
    if (!this.gameToPurge) return;
    if (this.purgeCountdownSeconds > 0) {
      console.warn('[CreatorStudioComponent] Premature permanent purge rejected: countdown active.');
      return;
    }
    if (!this.gamesData.permanentlyDeleteGame) return;

    const gameId = this.gameToPurge.id;
    const title = this.gameToPurge.title;
    this.purging = true;
    this.clearPurgeCountdownTimer();

    this.gamesData.permanentlyDeleteGame(gameId).subscribe({
      next: () => {
        this.purging = false;
        this.gameToPurge = null;
        this.loadStudioGames();
        this.toast.show({
          type: 'info',
          title: 'Permanently Erased',
          message: `"${title}" has been permanently purged.`
        });
      },
      error: () => {
        this.purging = false;
        this.toast.show({ type: 'error', title: 'Purge Failed', message: 'Could not erase listing.' });
      }
    });
  }

  emptyBin(): void {
    const user = this.auth.currentUser();
    if (!user || !this.gamesData.emptyRecycleBin) return;

    if (this.binGamesCount === 0) return;

    this.gamesData.emptyRecycleBin(user.id).subscribe({
      next: () => {
        this.loadStudioGames();
        this.toast.show({
          type: 'info',
          title: 'Recycle Bin Emptied',
          message: 'All archived games were permanently deleted.'
        });
      },
      error: () => {
        this.toast.show({ type: 'error', title: 'Failed', message: 'Could not empty Recycle Bin.' });
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.gameToBin) this.closeDeleteModal();
      if (this.gameToPurge) this.closePurgeModal();
    }
  }
}


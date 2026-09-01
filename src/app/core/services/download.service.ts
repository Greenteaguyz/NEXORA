import { Injectable, inject, signal } from '@angular/core';
import { Game } from '../models/game.model';
import { GAMES_DATA } from '../data/tokens';
import { ToastService } from './toast.service';
import { firstValueFrom } from 'rxjs';

export type DownloadPlatform = 'windows' | 'linux';

export interface DownloadItem {
  id: string;
  gameId: string;
  gameTitle: string;
  coverImageUrl?: string;
  platform: DownloadPlatform;
  filename: string;
  progress: number; // 0 - 100
  status: 'downloading' | 'completed' | 'paused';
  speed: string;
  totalSize: string;
  downloadedSize: string;
  startedAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  private gamesData = inject(GAMES_DATA);
  private toastService = inject(ToastService);

  readonly activeDownloads = signal<DownloadItem[]>([]);
  readonly isTrayOpen = signal<boolean>(false);
  readonly isTrayExpanded = signal<boolean>(false);

  toggleTray(): void {
    this.isTrayOpen.update(v => !v);
  }

  openTray(): void {
    this.isTrayOpen.set(true);
  }

  closeTray(): void {
    this.isTrayOpen.set(false);
  }

  toggleExpanded(): void {
    this.isTrayExpanded.update(v => !v);
  }

  clearCompleted(id?: string): void {
    if (id) {
      this.activeDownloads.update(items => items.filter(i => i.id !== id));
    } else {
      this.activeDownloads.update(items => items.filter(i => i.status !== 'completed'));
    }
    if (this.activeDownloads().length === 0) {
      this.isTrayOpen.set(false);
      this.isTrayExpanded.set(false);
    }
  }

  cancelDownload(id: string): void {
    this.activeDownloads.update(items => items.filter(i => i.id !== id));
    if (this.activeDownloads().length === 0) {
      this.isTrayOpen.set(false);
      this.isTrayExpanded.set(false);
    }
  }

  /**
   * Triggers a browser download for the specified game or game ID with target platform.
   * Delivers a standalone, DRM-free release package with offline launch manifest.
   */
  async downloadGameFile(target: Game | string, platform: DownloadPlatform = 'windows'): Promise<void> {
    let game: Game | undefined;

    if (typeof target === 'string') {
      game = await firstValueFrom(this.gamesData.getGameById(target));
      if (!game) {
        game = {
          id: target,
          ownerId: 'creator-1',
          title: 'NEXORA Game Package',
          description: 'Standalone Game Package',
          tags: ['Indie'],
          price: 0,
          coverImageUrl: '',
          screenshotUrls: [],
          samplePackageUrl: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      game = target;
    }

    const slug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let ext = 'zip';
    let platformLabel = 'Windows 32/64-bit Standalone';
    if (platform === 'linux') {
      ext = 'tar.gz';
      platformLabel = 'Linux x86_64 Native';
    }

    const filename = `${slug}-v1.0.0-${platform}.${ext}`;
    const totalSize = (game as any).packageSize || '1.85 GB';

    // Register active download item in Steam Download Tray
    const downloadId = 'dl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const downloadItem: DownloadItem = {
      id: downloadId,
      gameId: game.id,
      gameTitle: game.title,
      coverImageUrl: game.coverImageUrl,
      platform,
      filename,
      progress: 5,
      status: 'downloading',
      speed: '48.5 MB/s',
      totalSize,
      downloadedSize: '0.09 GB',
      startedAt: Date.now()
    };

    this.activeDownloads.update(items => [downloadItem, ...items]);
    this.isTrayOpen.set(true);

    // Show global toast
    this.toastService.show({
      type: 'download',
      title: `Downloading ${game.title}`,
      message: `${platformLabel} package initiated. Standalone release ready for offline play.`
    }, 4500);

    // Progress simulation steps
    setTimeout(() => {
      this.updateItemProgress(downloadId, 38, '52.1 MB/s', '0.70 GB');
    }, 400);

    setTimeout(() => {
      this.updateItemProgress(downloadId, 76, '56.4 MB/s', '1.41 GB');
    }, 900);

    setTimeout(() => {
      this.completeDownload(downloadId, totalSize);
    }, 1500);

    // Generate simulated standalone game package payload
    const manifestContent = JSON.stringify({
      title: game.title,
      gameId: game.id,
      version: '1.0.0',
      distribution: 'NEXORA 100% DRM-Free Standalone',
      targetPlatform: platformLabel,
      platforms: ['Windows 32/64-bit', 'Linux x86_64'],
      tags: game.tags,
      buildTimestamp: new Date().toISOString(),
      drmFreeVerification: 'VERIFIED_NEXORA_STANDALONE_RELEASE',
      integritySha256: 'a8f4c29188e734190b2847d9c0e5a9f2430198642bb3e721a947d10e83461f90',
      readme: `Thank you for downloading ${game.title} via NEXORA.\n\nThis release is 100% DRM-free with zero telemetry, zero mandatory launchers, and full offline execution.\n\nRun 'launch.exe' (Windows) or './launch.sh' (Linux) to start playing immediately.`
    }, null, 2);

    if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const blob = new Blob([manifestContent], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 1000);
    }
  }

  private updateItemProgress(id: string, progress: number, speed: string, downloadedSize: string): void {
    this.activeDownloads.update(items =>
      items.map(item => item.id === id && item.status === 'downloading'
        ? { ...item, progress, speed, downloadedSize }
        : item
      )
    );
  }

  private completeDownload(id: string, totalSize: string): void {
    this.activeDownloads.update(items =>
      items.map(item => item.id === id
        ? { ...item, progress: 100, status: 'completed', speed: 'Ready to Play', downloadedSize: totalSize }
        : item
      )
    );
  }
}

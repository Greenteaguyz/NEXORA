import { Injectable, inject } from '@angular/core';
import { Game } from '../models/game.model';
import { GAMES_DATA } from '../data/tokens';
import { ToastService } from './toast.service';
import { firstValueFrom } from 'rxjs';

export type DownloadPlatform = 'windows' | 'linux' | 'steamdeck';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  private gamesData = inject(GAMES_DATA);
  private toastService = inject(ToastService);

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
    let platformLabel = 'Windows 64-bit Standalone';
    if (platform === 'linux') {
      ext = 'tar.gz';
      platformLabel = 'Linux x86_64 Native';
    } else if (platform === 'steamdeck') {
      ext = 'zip';
      platformLabel = 'Steam Deck (Proton Verified)';
    }

    const filename = `${slug}-v1.0.0-${platform}.${ext}`;

    // Show non-intrusive global toast
    this.toastService.show({
      type: 'download',
      title: `Downloading ${game.title}`,
      message: `${platformLabel} package initiated. Standalone release ready for offline play.`
    }, 4500);

    // Generate simulated standalone game package payload
    const manifestContent = JSON.stringify({
      title: game.title,
      gameId: game.id,
      version: '1.0.0',
      distribution: 'NEXORA 100% DRM-Free Standalone',
      targetPlatform: platformLabel,
      platforms: ['Windows 10/11 x64', 'Linux x86_64', 'SteamDeck (Proton Verified)'],
      tags: game.tags,
      buildTimestamp: new Date().toISOString(),
      drmFreeVerification: 'VERIFIED_NEXORA_STANDALONE_RELEASE',
      integritySha256: 'a8f4c29188e734190b2847d9c0e5a9f2430198642bb3e721a947d10e83461f90',
      readme: `Thank you for downloading ${game.title} via NEXORA.\n\nThis release is 100% DRM-free with zero telemetry, zero mandatory launchers, and full offline execution.\n\nRun 'launch.exe' (Windows) or './launch.sh' (Linux) to start playing immediately.`
    }, null, 2);

    const blob = new Blob([manifestContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

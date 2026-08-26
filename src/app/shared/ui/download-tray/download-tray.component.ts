import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DownloadService, DownloadItem } from '../../../core/services/download.service';

@Component({
  selector: 'app-download-tray',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (downloadService.isTrayOpen() && downloadService.activeDownloads().length > 0) {
      <aside 
        class="download-tray-container" 
        [class.expanded]="downloadService.isTrayExpanded()"
        role="region" 
        aria-label="Active Game Downloads Manager">
        
        <!-- Expanded Downloads List Pane -->
        @if (downloadService.isTrayExpanded()) {
          <div class="tray-expanded-pane">
            <div class="expanded-header">
              <div class="expanded-title-group">
                <svg class="tray-title-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="expanded-heading">DOWNLOAD MANAGER</span>
                <span class="expanded-badge">{{ activeCount() }} Active</span>
              </div>
              <button 
                type="button" 
                class="btn-clear-completed" 
                (click)="downloadService.clearCompleted()"
                title="Clear completed downloads"
                aria-label="Clear all completed downloads">
                Clear Completed
              </button>
            </div>

            <div class="expanded-items-list" role="list">
              @for (item of downloadService.activeDownloads(); track item.id) {
                <div class="download-item-card" role="listitem">
                  <div class="item-thumb-wrap">
                    <img 
                      [src]="item.coverImageUrl || 'assets/logo-icon.svg'" 
                      [alt]="item.gameTitle + ' Cover'" 
                      class="item-thumb-img"
                      (error)="$any($event.target).src = 'assets/logo-icon.svg'">
                  </div>

                  <div class="item-content">
                    <div class="item-title-row">
                      <span class="item-title">{{ item.gameTitle }}</span>
                      <span class="item-platform-pill">{{ item.platform === 'windows' ? 'WIN x64' : 'LINUX' }}</span>
                    </div>

                    <!-- Progress Bar Track -->
                    <div class="item-progress-track" role="progressbar" [attr.aria-valuenow]="item.progress" aria-valuemin="0" aria-valuemax="100">
                      <div 
                        class="item-progress-fill" 
                        [class.complete]="item.status === 'completed'"
                        [style.width.%]="item.progress">
                      </div>
                    </div>

                    <div class="item-meta-row">
                      <span class="item-status-text" [class.complete]="item.status === 'completed'">
                        @if (item.status === 'completed') {
                          <svg class="status-check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <span>Ready to Play</span>
                        } @else {
                          <span>{{ item.downloadedSize }} / {{ item.totalSize }} ({{ item.progress }}%)</span>
                        }
                      </span>
                      <span class="item-speed-text">{{ item.speed }}</span>
                    </div>
                  </div>

                  <div class="item-actions">
                    @if (item.status === 'completed') {
                      <a routerLink="/library" (click)="downloadService.toggleExpanded()" class="btn-play-now" aria-label="Go to library to play">
                        Play
                      </a>
                    }
                    <button 
                      type="button" 
                      class="btn-dismiss-item" 
                      (click)="downloadService.cancelDownload(item.id)"
                      [attr.aria-label]="'Dismiss ' + item.gameTitle">
                      ✕
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Compact Bottom Docked Summary Bar -->
        <div class="tray-summary-bar">
          <button 
            type="button" 
            class="tray-summary-trigger" 
            (click)="downloadService.toggleExpanded()"
            [attr.aria-expanded]="downloadService.isTrayExpanded()"
            aria-label="Toggle download manager details pane">
            
            <div class="summary-left">
              <div class="tray-icon-cluster" [class.animating]="hasActiveDownloads()">
                <svg class="tray-main-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>

              <div class="summary-text-cluster">
                <span class="summary-title">
                  @if (latestItem(); as item) {
                    {{ item.gameTitle }} — {{ item.status === 'completed' ? 'Download Complete' : item.progress + '%' }}
                  } @else {
                    Downloads
                  }
                </span>
                <div class="summary-mini-track">
                  <div 
                    class="summary-mini-fill" 
                    [class.complete]="latestItem()?.status === 'completed'"
                    [style.width.%]="latestItem()?.progress || 0">
                  </div>
                </div>
              </div>
            </div>

            <div class="summary-right">
              @if (latestItem(); as item) {
                <span class="summary-speed-badge">{{ item.speed }}</span>
              }
              <svg class="chevron-toggle-svg" [class.open]="downloadService.isTrayExpanded()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </div>
          </button>

          <button 
            type="button" 
            class="btn-close-tray" 
            (click)="downloadService.closeTray()" 
            title="Minimize download tray"
            aria-label="Close download bar">
            ✕
          </button>
        </div>

      </aside>
    }
  `,
  styles: [`
    .download-tray-container {
      position: fixed;
      bottom: 16px;
      right: 24px;
      width: 440px;
      max-width: calc(100vw - 32px);
      z-index: 950;
      display: flex;
      flex-direction: column;
      background: #0e141bee;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(102, 192, 244, 0.28);
      border-radius: var(--radius-sm, 6px);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), 0 0 16px rgba(102, 192, 244, 0.12);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
      box-sizing: border-box;
      font-family: var(--font-sans, system-ui, sans-serif);
    }

    :host-context([data-theme="light"]) .download-tray-container {
      background: #fffffffa;
      border-color: rgba(2, 132, 199, 0.3);
      box-shadow: 0 12px 36px rgba(15, 23, 42, 0.2), 0 0 16px rgba(2, 132, 199, 0.1);
    }

    /* Summary Docked Bar */
    .tray-summary-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding: 0 12px;
      gap: 8px;
      background: rgba(16, 24, 34, 0.95);
    }

    :host-context([data-theme="light"]) .tray-summary-bar {
      background: #f8fafc;
    }

    .tray-summary-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex: 1;
      min-width: 0;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: inherit;
      text-align: left;
    }

    .summary-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }

    .tray-icon-cluster {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: var(--radius-xs, 4px);
      background: rgba(102, 192, 244, 0.12);
      color: var(--accent-400, #66c0f4);
      flex-shrink: 0;
    }

    :host-context([data-theme="light"]) .tray-icon-cluster {
      background: rgba(2, 132, 199, 0.1);
      color: #0284c7;
    }

    .tray-main-svg {
      width: 16px;
      height: 16px;
    }

    .tray-icon-cluster.animating .tray-main-svg {
      animation: pulse-download 1.4s infinite ease-in-out;
    }

    @keyframes pulse-download {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(2px); }
    }

    .summary-text-cluster {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    .summary-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host-context([data-theme="light"]) .summary-title {
      color: #0f172a;
    }

    .summary-mini-track {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    :host-context([data-theme="light"]) .summary-mini-track {
      background: #e2e8f0;
    }

    .summary-mini-fill {
      height: 100%;
      background: linear-gradient(90deg, #66c0f4, #419cd0);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .summary-mini-fill.complete {
      background: linear-gradient(90deg, #75b022, #588a1b);
    }

    .summary-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .summary-speed-badge {
      font-family: var(--font-mono, monospace);
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--accent-400, #66c0f4);
      background: rgba(102, 192, 244, 0.1);
      padding: 2px 6px;
      border-radius: var(--radius-xs, 2px);
    }

    :host-context([data-theme="light"]) .summary-speed-badge {
      color: #0284c7;
      background: rgba(2, 132, 199, 0.08);
    }

    .chevron-toggle-svg {
      width: 16px;
      height: 16px;
      color: #94a3b8;
      transition: transform 0.2s ease;
    }

    .chevron-toggle-svg.open {
      transform: rotate(180deg);
    }

    .btn-close-tray {
      background: none;
      border: none;
      color: #64748b;
      font-size: 0.85rem;
      padding: 4px 6px;
      cursor: pointer;
      border-radius: 2px;
      transition: all 0.15s ease;
    }

    .btn-close-tray:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    :host-context([data-theme="light"]) .btn-close-tray:hover {
      color: #0f172a;
      background: #e2e8f0;
    }

    /* Expanded Pane */
    .tray-expanded-pane {
      display: flex;
      flex-direction: column;
      max-height: 280px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    :host-context([data-theme="light"]) .tray-expanded-pane {
      border-bottom-color: #e2e8f0;
    }

    .expanded-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    :host-context([data-theme="light"]) .expanded-header {
      background: #f1f5f9;
      border-bottom-color: #e2e8f0;
    }

    .expanded-title-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tray-title-svg {
      width: 14px;
      height: 14px;
      color: var(--accent-400, #66c0f4);
    }

    .expanded-heading {
      font-family: var(--font-mono, monospace);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }

    .expanded-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      background: rgba(102, 192, 244, 0.15);
      color: var(--accent-400, #66c0f4);
    }

    .btn-clear-completed {
      background: none;
      border: none;
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 2px;
      transition: color 0.15s ease;
    }

    .btn-clear-completed:hover {
      color: #ffffff;
    }

    :host-context([data-theme="light"]) .btn-clear-completed:hover {
      color: #0f172a;
    }

    .expanded-items-list {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      max-height: 220px;
      padding: 8px;
      gap: 8px;
      scrollbar-width: thin;
    }

    .download-item-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-xs, 4px);
      transition: background 0.15s ease;
    }

    :host-context([data-theme="light"]) .download-item-card {
      background: #f8fafc;
      border-color: #e2e8f0;
    }

    .item-thumb-wrap {
      width: 44px;
      height: 28px;
      border-radius: 2px;
      overflow: hidden;
      background: #000;
      flex-shrink: 0;
    }

    .item-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .item-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    .item-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .item-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host-context([data-theme="light"]) .item-title {
      color: #0f172a;
    }

    .item-platform-pill {
      font-family: var(--font-mono, monospace);
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 4px;
      background: rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .item-progress-track {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    :host-context([data-theme="light"]) .item-progress-track {
      background: #e2e8f0;
    }

    .item-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #66c0f4, #419cd0);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .item-progress-fill.complete {
      background: linear-gradient(90deg, #75b022, #588a1b);
    }

    .item-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.7rem;
      color: #64748b;
    }

    .item-status-text {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
    }

    .item-status-text.complete {
      color: #4ade80;
    }

    .status-check-svg {
      width: 12px;
      height: 12px;
    }

    .item-speed-text {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      color: #94a3b8;
    }

    .item-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .btn-play-now {
      padding: 4px 10px;
      background: linear-gradient(135deg, #75b022, #588a1b);
      color: #ffffff;
      font-size: 0.74rem;
      font-weight: 700;
      border-radius: var(--radius-xs, 2px);
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .btn-play-now:hover {
      background: linear-gradient(135deg, #84c626, #639c1f);
    }

    .btn-dismiss-item {
      background: none;
      border: none;
      color: #64748b;
      font-size: 0.8rem;
      padding: 2px 4px;
      cursor: pointer;
      border-radius: 2px;
      transition: color 0.15s ease;
    }

    .btn-dismiss-item:hover {
      color: #ffffff;
    }

    :host-context([data-theme="light"]) .btn-dismiss-item:hover {
      color: #0f172a;
    }

    @media (max-width: 600px) {
      .download-tray-container {
        right: 12px;
        left: 12px;
        width: auto;
        bottom: 12px;
      }
    }
  `]
})
export class DownloadTrayComponent {
  protected downloadService = inject(DownloadService);

  readonly latestItem = computed<DownloadItem | undefined>(() => {
    const items = this.downloadService.activeDownloads();
    return items.length > 0 ? items[0] : undefined;
  });

  readonly activeCount = computed<number>(() => {
    return this.downloadService.activeDownloads().filter(i => i.status === 'downloading').length;
  });

  readonly hasActiveDownloads = computed<boolean>(() => {
    return this.activeCount() > 0;
  });
}

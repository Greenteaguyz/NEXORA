import { TestBed } from '@angular/core/testing';
import { ToastService } from '../services/toast.service';
import { DownloadService } from '../services/download.service';
import { GAMES_DATA } from '../data/tokens';
import { MockGamesDataService } from '../data/games/mock-games-data.service';
import { LocalStoreService } from '../persistence/local-store.service';

describe('ToastService & DownloadService — Notification & Delivery Suite', () => {
  let toastService: ToastService;
  let downloadService: DownloadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ToastService,
        DownloadService,
        LocalStoreService,
        { provide: GAMES_DATA, useClass: MockGamesDataService }
      ]
    });
    toastService = TestBed.inject(ToastService);
    downloadService = TestBed.inject(DownloadService);
  });

  it('1. should show and queue toast notifications', () => {
    expect(toastService.toasts().length).toBe(0);

    toastService.show({
      type: 'success',
      title: 'Order Confirmed',
      message: 'Game added to your library.'
    });

    expect(toastService.toasts().length).toBe(1);
    const toast = toastService.toasts()[0];
    expect(toast.title).toBe('Order Confirmed');
    expect(toast.type).toBe('success');
  });

  it('2. should manually dismiss toast by ID', () => {
    toastService.show({
      type: 'info',
      title: 'Info Notice',
      message: 'Test message'
    });

    const toast = toastService.toasts()[0];
    toastService.dismiss(toast.id);
    expect(toastService.toasts().length).toBe(0);
  });

  it('3. should initiate standalone game download package and trigger toast', async () => {
    await downloadService.downloadGameFile('game_001', 'windows');
    
    const activeToasts = toastService.toasts();
    expect(activeToasts.length).toBeGreaterThanOrEqual(1);
    const downloadToast = activeToasts.find(t => t.type === 'download');
    expect(downloadToast).toBeDefined();
    expect(downloadToast?.title).toContain('Downloading');
  });
});

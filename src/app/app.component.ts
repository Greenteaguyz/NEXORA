import { Component, signal, HostListener, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ToastComponent } from './shared/ui/toast/toast.component';
import { CommandPaletteComponent } from './shared/ui/command-palette/command-palette.component';
import { DownloadTrayComponent } from './shared/ui/download-tray/download-tray.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent, CommandPaletteComponent, DownloadTrayComponent],
  template: `
    <a href="#main-content" class="skip-to-content">Skip to main content</a>
    <app-header></app-header>
    <main id="main-content" class="main-content" tabindex="-1">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
    <app-toast></app-toast>
    <app-download-tray></app-download-tray>
    <app-command-palette></app-command-palette>

    <!-- Pure Virtual Floating Overlay Scroll Indicator (0px Layout Displacement & 2s Auto-Hide) -->
    <div 
      class="virtual-scroll-track" 
      [class.active]="isScrollingActive() && isScrollable()" 
      aria-hidden="true">
      <div 
        class="virtual-scroll-thumb" 
        [style.transform]="'translate3d(0, ' + scrollThumbTop() + 'px, 0)'">
      </div>
    </div>
  `
})
export class AppComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  scrollThumbTop = signal<number>(0);
  isScrollable = signal<boolean>(false);
  isScrollingActive = signal<boolean>(false);
  private scrollTimeout: any = null;
  private isRafScheduled = false;

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowScroll() {
    if (!isPlatformBrowser(this.platformId) || this.isRafScheduled) return;

    this.isRafScheduled = true;
    requestAnimationFrame(() => {
      this.isRafScheduled = false;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 20) {
        this.isScrollable.set(true);
        this.isScrollingActive.set(true);

        const isMobile = window.innerWidth <= 768;
        const topOffset = isMobile ? 62 : 74;
        const bottomOffset = isMobile ? 68 : 12;
        const thumbHeight = 48;
        const availableTrack = window.innerHeight - topOffset - bottomOffset - thumbHeight;
        const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
        this.scrollThumbTop.set(progress * Math.max(availableTrack, 0));

        // Reset 2.0-second auto-hide inactivity timer
        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
          this.isScrollingActive.set(false);
        }, 2000);
      } else {
        this.isScrollable.set(false);
        this.isScrollingActive.set(false);
      }
    });
  }

  ngOnDestroy() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }
}

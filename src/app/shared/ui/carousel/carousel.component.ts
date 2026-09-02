import {
  Component,
  input,
  signal,
  computed,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  HostListener,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarouselSlide } from './carousel.model';
import { getNextSlideIndex, getPrevSlideIndex, resolveActiveMedia } from './carousel.util';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarouselComponent<T = any> implements OnInit, OnDestroy {
  slides = input<CarouselSlide<T>[]>([]);
  autoplayMs = input<number>(5000);
  showThumbnails = input<boolean>(true);
  showControls = input<boolean>(true);
  showPagination = input<boolean>(true);

  @Output() slideChange = new EventEmitter<number>();
  @Output() actionClick = new EventEmitter<CarouselSlide<T>>();

  private platformId = inject(PLATFORM_ID);
  private autoplayTimerId: any = null;

  currentIndex = signal<number>(0);
  hoveredThumbIndex = signal<number | null>(null);
  isTransitioning = signal<boolean>(false);
  isHovered = signal<boolean>(false);

  currentSlide = computed(() => {
    const list = this.slides();
    if (!list || list.length === 0) return null;
    const idx = Math.min(this.currentIndex(), list.length - 1);
    return list[idx] || null;
  });

  activeMediaUrl = computed(() => {
    const slide = this.currentSlide();
    if (!slide) return 'assets/logo-icon.svg';
    return resolveActiveMedia(slide.mainImageUrl, slide.thumbnailUrls, this.hoveredThumbIndex());
  });

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    }
  }

  next(): void {
    const total = this.slides().length;
    if (total <= 1) return;
    this.triggerTransition();
    const nextIdx = getNextSlideIndex(this.currentIndex(), total, true);
    this.goToSlide(nextIdx);
  }

  prev(): void {
    const total = this.slides().length;
    if (total <= 1) return;
    this.triggerTransition();
    const prevIdx = getPrevSlideIndex(this.currentIndex(), total, true);
    this.goToSlide(prevIdx);
  }

  goToSlide(index: number): void {
    this.hoveredThumbIndex.set(null);
    this.currentIndex.set(index);
    this.slideChange.emit(index);
    this.restartAutoplay();
  }

  onThumbHover(idx: number): void {
    this.hoveredThumbIndex.set(idx);
  }

  onThumbLeave(): void {
    this.hoveredThumbIndex.set(null);
  }

  onMouseEnter(): void {
    this.isHovered.set(true);
    this.stopAutoplay();
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
    this.startAutoplay();
  }

  private triggerTransition(): void {
    this.isTransitioning.set(true);
    setTimeout(() => {
      this.isTransitioning.set(false);
    }, 250);
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    if (!isPlatformBrowser(this.platformId) || this.slides().length <= 1) return;

    this.autoplayTimerId = setInterval(() => {
      if (!this.isHovered()) {
        this.next();
      }
    }, this.autoplayMs());
  }

  private stopAutoplay(): void {
    if (this.autoplayTimerId) {
      clearInterval(this.autoplayTimerId);
      this.autoplayTimerId = null;
    }
  }

  private restartAutoplay(): void {
    this.startAutoplay();
  }
}

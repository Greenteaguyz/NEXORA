import { Directive, OnInit, OnDestroy, inject } from '@angular/core';
import { ScrollLockService } from '../../core/services/scroll-lock.service';

/**
 * Applies the ref-counted body scroll lock for the lifetime of its host element.
 * Attach to a fullscreen overlay root (modal backdrop, drawer, palette) so the
 * background page cannot scroll while the overlay is mounted.
 */
@Directive({
  selector: '[appScrollLock]',
  standalone: true
})
export class ScrollLockDirective implements OnInit, OnDestroy {
  private readonly scrollLock = inject(ScrollLockService);

  ngOnInit(): void {
    this.scrollLock.lock();
  }

  ngOnDestroy(): void {
    this.scrollLock.unlock();
  }
}

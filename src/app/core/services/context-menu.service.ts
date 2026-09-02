import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ContextMenuItem, ContextMenuPosition } from '../../shared/ui/context-menu/context-menu.model';
import { calculateContextMenuPosition } from '../../shared/ui/context-menu/context-menu-position.util';

@Injectable({
  providedIn: 'root'
})
export class ContextMenuService {
  private platformId = inject(PLATFORM_ID);

  isOpen = signal<boolean>(false);
  items = signal<ContextMenuItem[]>([]);
  position = signal<ContextMenuPosition>({ top: 0, left: 0 });

  open(items: ContextMenuItem[], clientX: number, clientY: number): void {
    if (!items || items.length === 0) return;

    let pos: ContextMenuPosition = { top: clientY, left: clientX };

    if (isPlatformBrowser(this.platformId)) {
      const estimatedWidth = 200;
      const estimatedHeight = items.length * 36 + 16;
      pos = calculateContextMenuPosition(
        clientX,
        clientY,
        estimatedWidth,
        estimatedHeight,
        window.innerWidth,
        window.innerHeight
      );
    }

    this.items.set(items);
    this.position.set(pos);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.items.set([]);
  }
}

import { Directive, Input, HostListener, inject } from '@angular/core';
import { ContextMenuService } from '../../../core/services/context-menu.service';
import { ContextMenuItem } from './context-menu.model';

@Directive({
  selector: '[appContextMenu]',
  standalone: true
})
export class ContextMenuDirective {
  private contextMenuService = inject(ContextMenuService);

  @Input({ required: true, alias: 'appContextMenu' }) menuItems: ContextMenuItem[] = [];

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    if (!this.menuItems || this.menuItems.length === 0) return;

    event.preventDefault();
    event.stopPropagation();

    this.contextMenuService.open(this.menuItems, event.clientX, event.clientY);
  }
}

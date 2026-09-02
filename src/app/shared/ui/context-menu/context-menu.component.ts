import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChildren,
  QueryList,
  HostListener,
  AfterViewInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuItem, ContextMenuPosition } from './context-menu.model';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextMenuComponent implements AfterViewInit {
  @Input({ required: true }) items: ContextMenuItem[] = [];
  @Input({ required: true }) position: ContextMenuPosition = { top: 0, left: 0 };
  @Input() ariaLabel = 'Context Menu';

  @Output() itemSelected = new EventEmitter<ContextMenuItem>();
  @Output() closed = new EventEmitter<void>();

  @ViewChildren('menuItemBtn') menuItemButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  focusedIndex = -1;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    // Focus first active item on mount
    setTimeout(() => {
      this.focusFirstItem();
    }, 0);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closed.emit();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closed.emit();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const buttons = this.menuItemButtons?.toArray() || [];
    if (!buttons.length) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex = (this.focusedIndex + 1) % buttons.length;
        buttons[this.focusedIndex]?.nativeElement.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex = (this.focusedIndex - 1 + buttons.length) % buttons.length;
        buttons[this.focusedIndex]?.nativeElement.focus();
        break;
      case 'Escape':
        event.preventDefault();
        this.closed.emit();
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirstItem();
        break;
      case 'End':
        event.preventDefault();
        this.focusLastItem();
        break;
    }
  }

  onSelect(item: ContextMenuItem, event: Event): void {
    event.stopPropagation();
    if (item.disabled) return;
    this.itemSelected.emit(item);
    item.action();
    this.closed.emit();
  }

  private focusFirstItem(): void {
    const buttons = this.menuItemButtons?.toArray() || [];
    if (buttons.length > 0) {
      this.focusedIndex = 0;
      buttons[0]?.nativeElement.focus();
    }
  }

  private focusLastItem(): void {
    const buttons = this.menuItemButtons?.toArray() || [];
    if (buttons.length > 0) {
      this.focusedIndex = buttons.length - 1;
      buttons[this.focusedIndex]?.nativeElement.focus();
    }
  }
}

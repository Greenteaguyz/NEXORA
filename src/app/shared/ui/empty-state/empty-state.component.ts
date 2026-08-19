import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css']
})
export class EmptyStateComponent {
  private router = inject(Router, { optional: true });

  @Input() icon = 'gamepad';
  @Input() title = 'No Games Found';
  @Input() message = 'Try adjusting your search criteria or removing active filters to see results.';
  @Input() actionLabel = '';
  @Input() routerLink: string | any[] = '';

  @Output() actionClicked = new EventEmitter<void>();
  @Output() action = new EventEmitter<void>();

  onAction(): void {
    if (this.routerLink && this.router) {
      if (typeof this.routerLink === 'string') {
        this.router.navigate([this.routerLink]);
      } else {
        this.router.navigate(this.routerLink);
      }
    }
    this.actionClicked.emit();
    this.action.emit();
  }

  get normalizedIcon(): string {
    const i = (this.icon || '').trim();
    if (i === '🎮' || i.toLowerCase().includes('game')) return 'gamepad';
    if (i === '🔍' || i.toLowerCase().includes('search')) return 'search';
    if (i === '💖' || i === '❤️' || i.toLowerCase().includes('heart') || i.toLowerCase().includes('wish')) return 'heart';
    if (i === '🧾' || i.toLowerCase().includes('receipt') || i.toLowerCase().includes('order')) return 'receipt';
    if (i === '🚀' || i.toLowerCase().includes('rocket') || i.toLowerCase().includes('publish') || i.toLowerCase().includes('studio')) return 'rocket';
    if (i === '⚠️' || i.toLowerCase().includes('warn') || i.toLowerCase().includes('alert') || i.toLowerCase().includes('error')) return 'warning';
    return i;
  }
}


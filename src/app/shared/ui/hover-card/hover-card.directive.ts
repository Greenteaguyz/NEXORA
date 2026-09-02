import { Directive, Input, HostListener, ElementRef, inject } from '@angular/core';
import { Game } from '../../../core/models/game.model';
import { HoverCardService } from '../../../core/services/hover-card.service';

@Directive({
  selector: '[appHoverCard]',
  standalone: true
})
export class HoverCardDirective {
  private el = inject(ElementRef);
  private hoverCardService = inject(HoverCardService);

  @Input({ required: true, alias: 'appHoverCard' }) game!: Game;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.game) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.hoverCardService.scheduleOpen(this.game, rect);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hoverCardService.close();
  }
}

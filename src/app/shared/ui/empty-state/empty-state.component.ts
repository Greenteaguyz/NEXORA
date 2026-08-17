import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css']
})
export class EmptyStateComponent {
  @Input() icon = '🎮';
  @Input() title = 'No Games Found';
  @Input() message = 'Try adjusting your search criteria or removing active filters to see results.';
  @Input() actionLabel = '';

  @Output() actionClicked = new EventEmitter<void>();
}

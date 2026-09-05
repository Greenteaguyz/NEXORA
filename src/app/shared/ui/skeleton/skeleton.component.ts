import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Primitive skeleton placeholder — shadcn/ui pattern, NEXORA tokens.
 * Usage:
 *   <app-skeleton width="100%" height="1rem" shape="rect" />
 *   <app-skeleton width="3rem" height="3rem" shape="circle" />
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="skeleton"
      [class.skeleton--circle]="shape === 'circle'"
      [style.width]="width"
      [style.height]="height"
      role="status"
      aria-label="Loading"
      aria-busy="true">
    </div>
  `,
  styleUrls: ['./skeleton.component.css']
})
export class SkeletonComponent {
  @Input() width  = '100%';
  @Input() height = '1rem';
  @Input() shape: 'rect' | 'circle' = 'rect';
}

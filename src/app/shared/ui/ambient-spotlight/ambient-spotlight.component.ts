import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-ambient-spotlight',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="ambient-spotlight-backdrop" 
      [style.--spotlight-primary]="primaryGlow()" 
      [style.--spotlight-secondary]="secondaryGlow()"
      [style.--spotlight-height]="height()"
      aria-hidden="true">
      <div class="spotlight-layer layer-primary" aria-hidden="true"></div>
      <div class="spotlight-layer layer-secondary" aria-hidden="true"></div>
      <div class="spotlight-vignette" aria-hidden="true"></div>
    </div>
  `,
  styleUrl: './ambient-spotlight.component.css'
})
export class AmbientSpotlightComponent {
  readonly primaryGlow = input<string>('rgba(102, 192, 244, 0.28)');
  readonly secondaryGlow = input<string>('rgba(99, 102, 241, 0.18)');
  readonly height = input<string>('820px');
}

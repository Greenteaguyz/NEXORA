import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PaymentBrandMarkKind = 'visa' | 'mastercard' | 'aba' | 'khqr';

/**
 * Crisp vector brand marks for payment methods (Visa, Mastercard, ABA, KHQR).
 * Pure inline SVG with explicit viewBox — no raster assets, no OS emoji glyphs.
 */
@Component({
  selector: 'app-payment-brand-mark',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (mark()) {
      @case ('visa') {
        <svg class="brand-mark" viewBox="0 0 64 22" role="img" aria-label="Visa" [attr.height]="height()">
          <rect x="0.5" y="0.5" width="63" height="21" rx="3" fill="#1434CB"/>
          <text x="32" y="15.5" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" font-style="italic" letter-spacing="1" fill="#FFFFFF">VISA</text>
        </svg>
      }
      @case ('mastercard') {
        <svg class="brand-mark" viewBox="0 0 64 22" role="img" aria-label="Mastercard" [attr.height]="height()">
          <rect x="0.5" y="0.5" width="63" height="21" rx="3" fill="#16181B"/>
          <circle cx="27" cy="11" r="6.5" fill="#EB001B"/>
          <circle cx="37" cy="11" r="6.5" fill="#F79E1B"/>
          <path d="M32 5.8a6.5 6.5 0 0 0 0 10.4 6.5 6.5 0 0 0 0-10.4z" fill="#FF5F00"/>
        </svg>
      }
      @case ('aba') {
        <svg class="brand-mark" viewBox="0 0 64 22" role="img" aria-label="ABA Bank" [attr.height]="height()">
          <defs>
            <linearGradient id="aba-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#E22326"/>
              <stop offset="100%" stop-color="#C51619"/>
            </linearGradient>
          </defs>
          <!-- Base badge with rounded corners -->
          <rect x="0.5" y="0.5" width="63" height="21" rx="3.5" fill="url(#aba-grad)"/>
          <rect x="0.5" y="0.5" width="63" height="21" rx="3.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.8"/>
          <!-- Top subtle inner highlight -->
          <path d="M 4 1.5 L 60 1.5" stroke="rgba(255,255,255,0.35)" stroke-width="0.75" stroke-linecap="round"/>
          <!-- ABA Geometric Vector Mark -->
          <text x="32" y="15" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="900" letter-spacing="2" fill="#FFFFFF">ABA</text>
        </svg>
      }
      @case ('khqr') {
        <svg class="brand-mark" viewBox="0 0 64 22" role="img" aria-label="KHQR" [attr.height]="height()">
          <rect x="0.5" y="0.5" width="63" height="21" rx="3" fill="#8A1538"/>
          <text x="30" y="15" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="9" font-weight="800" letter-spacing="0.5" fill="#FFFFFF">KHQR</text>
          <rect x="50" y="5" width="4" height="4" fill="#FFFFFF"/>
          <rect x="55" y="10" width="4" height="4" fill="#FFFFFF"/>
          <rect x="50" y="15" width="4" height="4" fill="#FFFFFF"/>
        </svg>
      }
    }
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }
    .brand-mark { display: block; }
  `]
})
export class PaymentBrandMarkComponent {
  readonly mark = input.required<PaymentBrandMarkKind>();
  readonly height = input(18);
}

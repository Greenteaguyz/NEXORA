import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Deterministic pseudo-QR module grid. Encodes nothing — visual fidelity only,
 * seeded from a string so server and client renders match and the pattern is
 * stable across change-detection cycles.
 */
function qrModules(seed: string, size: number): boolean[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    cells.push(((h >>> 0) % 100) < 48);
  }
  return cells;
}

/**
 * Recreated Bakong/ABA KHQR payment card — red clipped band, KHQR wordmark,
 * mock QR panel with center emblem, KHR + USD account rows with fictional
 * demo account numbers. No real banking data.
 */
@Component({
  selector: 'app-khqr-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './khqr-card.component.html',
  styleUrl: './khqr-card.component.css'
})
export class KhqrCardComponent {
  readonly holderName = input('NEXORA Demo User');
  readonly khrAccount = input('008 278 632');
  readonly usdAccount = input('008 278 629');
  readonly seed = input('nexora-khqr');
  /** Checkout variant: QR-only — hides account rows and footer, shrinks the stage. */
  readonly compact = input(false);

  readonly gridSize = 21;
  readonly cells = computed(() => qrModules(this.seed() + this.holderName(), this.gridSize));

  isFinderZone(row: number, col: number): boolean {
    const n = this.gridSize;
    const inCorner = (r0: number, c0: number) => row >= r0 && row < r0 + 7 && col >= c0 && col < c0 + 7;
    return inCorner(0, 0) || inCorner(0, n - 7) || inCorner(n - 7, 0);
  }

  isCenter(row: number, col: number): boolean {
    const mid = (this.gridSize - 3) / 2;
    return row >= mid - 1 && row <= mid + 1 && col >= mid - 1 && col <= mid + 1;
  }

  isOn(row: number, col: number): boolean {
    if (this.isCenter(row, col)) {
      return false;
    }
    return this.cells()[row * this.gridSize + col];
  }

  cellTrack(row: number, col: number): string {
    return `${row}-${col}`;
  }
}

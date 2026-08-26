import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  NgZone,
  DestroyRef,
  AfterViewInit,
  input,
  viewChild,
  inject
} from '@angular/core';

export type ShapeGridDirection = 'right' | 'left' | 'up' | 'down' | 'diagonal';
export type GridShape = 'square' | 'hexagon' | 'circle' | 'triangle';

interface CellCoord {
  x: number;
  y: number;
}

@Component({
  selector: 'app-shape-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shapegrid-container" #container>
      <canvas #canvas class="shapegrid-canvas" aria-hidden="true"></canvas>
      <div class="shapegrid-vignette" aria-hidden="true"></div>
    </div>
  `,
  styleUrl: './shape-grid.component.css'
})
export class ShapeGridComponent implements AfterViewInit {
  // Configurable Signal Inputs with calibrated Steam visibility defaults
  readonly direction = input<ShapeGridDirection>('right');
  readonly speed = input<number>(0.85);
  readonly borderColor = input<string>('rgba(102, 192, 244, 0.22)');
  readonly hoverFillColor = input<string>('rgba(102, 192, 244, 0.45)');
  readonly glowColor = input<string>('rgba(102, 192, 244, 0.35)');
  readonly glowBlur = input<number>(5);
  readonly squareSize = input<number>(54);
  readonly shape = input<GridShape>('hexagon');
  readonly hoverTrailAmount = input<number>(6);

  // Template References
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly containerRef = viewChild.required<ElementRef<HTMLElement>>('container');

  // Services
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  // Internal Animation State
  private requestRef: number | null = null;
  private gridOffset = { x: 0, y: 0 };
  private hoveredSquare: CellCoord | null = null;
  private trailCells: CellCoord[] = [];
  private cellOpacities = new Map<string, number>();

  private isVisible = true;
  private isPageVisible = !document.hidden;
  private prefersReducedMotion = false;
  private isDestroyed = false;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    // Check prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = motionQuery.matches;

    // Run all canvas loops and event attachments OUTSIDE NgZone to prevent CD churn
    this.ngZone.runOutsideAngular(() => {
      this.initCanvasLifecycle();
    });
  }

  private initCanvasLifecycle(): void {
    const canvas = this.canvasRef().nativeElement;
    const container = this.containerRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (this.isDestroyed) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = container.offsetWidth || window.innerWidth;
      const height = container.offsetHeight || 820;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(container);
    resizeCanvas();

    // Geometric Drawing Helpers
    const drawHex = (cx: number, cy: number, size: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const vx = cx + size * Math.cos(angle);
        const vy = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
    };

    const drawCircle = (cx: number, cy: number, size: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.closePath();
    };

    const drawTriangle = (cx: number, cy: number, size: number, flip: boolean) => {
      ctx.beginPath();
      if (flip) {
        ctx.moveTo(cx, cy + size / 2);
        ctx.lineTo(cx + size / 2, cy - size / 2);
        ctx.lineTo(cx - size / 2, cy - size / 2);
      } else {
        ctx.moveTo(cx, cy - size / 2);
        ctx.lineTo(cx + size / 2, cy + size / 2);
        ctx.lineTo(cx - size / 2, cy + size / 2);
      }
      ctx.closePath();
    };

    const drawGrid = () => {
      const w = container.offsetWidth || window.innerWidth;
      const h = container.offsetHeight || 820;
      ctx.shadowBlur = 0;
      ctx.clearRect(0, 0, w, h);

      const size = this.squareSize();
      const currentShape = this.shape();
      const isHex = currentShape === 'hexagon';
      const isTri = currentShape === 'triangle';
      const hexHoriz = size * 1.5;
      const hexVert = size * Math.sqrt(3);

      const glow = this.glowBlur();
      const glowColor = this.glowColor();

      if (isHex) {
        const colShift = Math.floor(this.gridOffset.x / hexHoriz);
        const offsetX = ((this.gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
        const offsetY = ((this.gridOffset.y % hexVert) + hexVert) % hexVert;

        const cols = Math.ceil(w / hexHoriz) + 3;
        const rows = Math.ceil(h / hexVert) + 3;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * hexHoriz + offsetX;
            const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY;

            const cellKey = `${col},${row}`;
            const alpha = this.cellOpacities.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = Math.min(glow * 2, 10);
              drawHex(cx, cy, size * 0.96);
              ctx.fillStyle = this.hoverFillColor();
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            ctx.shadowColor = glowColor;
            ctx.shadowBlur = glow;
            drawHex(cx, cy, size * 0.96);
            ctx.strokeStyle = this.borderColor();
            ctx.lineWidth = 1.25;
            ctx.stroke();
          }
        }
      } else if (isTri) {
        const halfW = size / 2;
        const colShift = Math.floor(this.gridOffset.x / halfW);
        const rowShift = Math.floor(this.gridOffset.y / size);
        const offsetX = ((this.gridOffset.x % halfW) + halfW) % halfW;
        const offsetY = ((this.gridOffset.y % size) + size) % size;

        const cols = Math.ceil(w / halfW) + 4;
        const rows = Math.ceil(h / size) + 4;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * halfW + offsetX;
            const cy = row * size + size / 2 + offsetY;
            const flip = ((col + colShift + row + rowShift) % 2 + 2) % 2 !== 0;

            const cellKey = `${col},${row}`;
            const alpha = this.cellOpacities.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = Math.min(glow * 2, 10);
              drawTriangle(cx, cy, size, flip);
              ctx.fillStyle = this.hoverFillColor();
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            ctx.shadowColor = glowColor;
            ctx.shadowBlur = glow;
            drawTriangle(cx, cy, size, flip);
            ctx.strokeStyle = this.borderColor();
            ctx.lineWidth = 1.25;
            ctx.stroke();
          }
        }
      } else if (currentShape === 'circle') {
        const offsetX = ((this.gridOffset.x % size) + size) % size;
        const offsetY = ((this.gridOffset.y % size) + size) % size;

        const cols = Math.ceil(w / size) + 3;
        const rows = Math.ceil(h / size) + 3;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * size + size / 2 + offsetX;
            const cy = row * size + size / 2 + offsetY;

            const cellKey = `${col},${row}`;
            const alpha = this.cellOpacities.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = Math.min(glow * 2, 10);
              drawCircle(cx, cy, size * 0.9);
              ctx.fillStyle = this.hoverFillColor();
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            ctx.shadowColor = glowColor;
            ctx.shadowBlur = glow;
            drawCircle(cx, cy, size * 0.9);
            ctx.strokeStyle = this.borderColor();
            ctx.lineWidth = 1.25;
            ctx.stroke();
          }
        }
      } else {
        // Square
        const offsetX = ((this.gridOffset.x % size) + size) % size;
        const offsetY = ((this.gridOffset.y % size) + size) % size;

        const cols = Math.ceil(w / size) + 3;
        const rows = Math.ceil(h / size) + 3;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const sx = col * size + offsetX;
            const sy = row * size + offsetY;

            const cellKey = `${col},${row}`;
            const alpha = this.cellOpacities.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = Math.min(glow * 2, 10);
              ctx.fillStyle = this.hoverFillColor();
              ctx.fillRect(sx, sy, size, size);
              ctx.globalAlpha = 1;
            }

            ctx.shadowColor = glowColor;
            ctx.shadowBlur = glow;
            ctx.strokeStyle = this.borderColor();
            ctx.lineWidth = 1.25;
            ctx.strokeRect(sx, sy, size, size);
          }
        }
      }
    };

    const updateCellOpacities = () => {
      const targets = new Map<string, number>();

      if (this.hoveredSquare) {
        targets.set(`${this.hoveredSquare.x},${this.hoveredSquare.y}`, 1);
      }

      const trailAmount = this.hoverTrailAmount();
      if (trailAmount > 0) {
        for (let i = 0; i < this.trailCells.length; i++) {
          const t = this.trailCells[i];
          const key = `${t.x},${t.y}`;
          if (!targets.has(key)) {
            targets.set(key, (this.trailCells.length - i) / (this.trailCells.length + 1));
          }
        }
      }

      for (const [key] of targets) {
        if (!this.cellOpacities.has(key)) {
          this.cellOpacities.set(key, 0);
        }
      }

      for (const [key, opacity] of this.cellOpacities) {
        const target = targets.get(key) || 0;
        const next = opacity + (target - opacity) * 0.18;
        if (next < 0.005) {
          this.cellOpacities.delete(key);
        } else {
          this.cellOpacities.set(key, next);
        }
      }
    };

    const updateAnimation = () => {
      if (this.isDestroyed) return;

      if (!this.prefersReducedMotion) {
        const effectiveSpeed = Math.max(this.speed(), 0.05);
        const size = this.squareSize();
        const currentShape = this.shape();
        const hexHoriz = size * 1.5;
        const hexVert = size * Math.sqrt(3);

        const wrapX = currentShape === 'hexagon' ? hexHoriz * 2 : size;
        const wrapY = currentShape === 'hexagon' ? hexVert : currentShape === 'triangle' ? size * 2 : size;

        switch (this.direction()) {
          case 'right':
            this.gridOffset.x = (this.gridOffset.x + effectiveSpeed + wrapX) % wrapX;
            break;
          case 'left':
            this.gridOffset.x = (this.gridOffset.x - effectiveSpeed + wrapX) % wrapX;
            break;
          case 'up':
            this.gridOffset.y = (this.gridOffset.y - effectiveSpeed + wrapY) % wrapY;
            break;
          case 'down':
            this.gridOffset.y = (this.gridOffset.y + effectiveSpeed + wrapY) % wrapY;
            break;
          case 'diagonal':
            this.gridOffset.x = (this.gridOffset.x + effectiveSpeed + wrapX) % wrapX;
            this.gridOffset.y = (this.gridOffset.y + effectiveSpeed + wrapY) % wrapY;
            break;
        }
      }

      updateCellOpacities();
      drawGrid();

      if (this.isVisible && this.isPageVisible) {
        this.requestRef = requestAnimationFrame(updateAnimation);
      } else {
        this.requestRef = null;
      }
    };

    const tryStart = () => {
      if (this.isVisible && this.isPageVisible && !this.requestRef && !this.isDestroyed) {
        this.requestRef = requestAnimationFrame(updateAnimation);
      }
    };

    const tryStop = () => {
      if (this.requestRef) {
        cancelAnimationFrame(this.requestRef);
        this.requestRef = null;
      }
    };

    // Passive Window Pointer Tracker: Tracks hover without intercepting any clicks or gestures
    const handlePointerMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) {
        this.hoveredSquare = null;
        return;
      }

      const size = this.squareSize();
      const currentShape = this.shape();
      const isHex = currentShape === 'hexagon';
      const isTri = currentShape === 'triangle';
      const hexHoriz = size * 1.5;
      const hexVert = size * Math.sqrt(3);

      let col = 0;
      let row = 0;

      if (isHex) {
        const colShift = Math.floor(this.gridOffset.x / hexHoriz);
        const offsetX = ((this.gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
        const offsetY = ((this.gridOffset.y % hexVert) + hexVert) % hexVert;
        const adjustedX = mouseX - offsetX;
        const adjustedY = mouseY - offsetY;

        col = Math.round(adjustedX / hexHoriz);
        const rowOffset = (col + colShift) % 2 !== 0 ? hexVert / 2 : 0;
        row = Math.round((adjustedY - rowOffset) / hexVert);
      } else if (isTri) {
        const halfW = size / 2;
        const offsetX = ((this.gridOffset.x % halfW) + halfW) % halfW;
        const offsetY = ((this.gridOffset.y % size) + size) % size;
        col = Math.round((mouseX - offsetX) / halfW);
        row = Math.floor((mouseY - offsetY) / size);
      } else {
        const offsetX = ((this.gridOffset.x % size) + size) % size;
        const offsetY = ((this.gridOffset.y % size) + size) % size;
        col = Math.floor((mouseX - offsetX) / size);
        row = Math.floor((mouseY - offsetY) / size);
      }

      const trailAmount = this.hoverTrailAmount();
      if (!this.hoveredSquare || this.hoveredSquare.x !== col || this.hoveredSquare.y !== row) {
        if (this.hoveredSquare && trailAmount > 0) {
          this.trailCells.unshift({ ...this.hoveredSquare });
          if (this.trailCells.length > trailAmount) {
            this.trailCells.length = trailAmount;
          }
        }
        this.hoveredSquare = { x: col, y: row };
      }
    };

    const handlePointerLeave = () => {
      const trailAmount = this.hoverTrailAmount();
      if (this.hoveredSquare && trailAmount > 0) {
        this.trailCells.unshift({ ...this.hoveredSquare });
        if (this.trailCells.length > trailAmount) {
          this.trailCells.length = trailAmount;
        }
      }
      this.hoveredSquare = null;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave, { passive: true });

    // IntersectionObserver to conserve 0.0% CPU when scrolled away
    const io = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry.isIntersecting;
        this.isVisible ? tryStart() : tryStop();
      },
      { threshold: 0.02 }
    );
    io.observe(container);

    const onVisibilityChange = () => {
      this.isPageVisible = !document.hidden;
      this.isPageVisible ? tryStart() : tryStop();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    tryStart();

    // Destroy Lifecycle Hook
    this.destroyRef.onDestroy(() => {
      this.isDestroyed = true;
      tryStop();
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      this.cellOpacities.clear();
      this.trailCells = [];
    });
  }
}

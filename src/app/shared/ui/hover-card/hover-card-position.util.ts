import { HoverCardPosition } from './hover-card.model';

export interface BoundingRectLike {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

/**
 * Computes deterministic, viewport-aware coordinates for a hover preview card.
 * Positions the hover card adjacent to the target element (preferring right, flipping left if space is constrained)
 * and clamps within viewport boundaries with safety edge padding.
 */
export function calculateHoverCardPosition(
  targetRect: BoundingRectLike,
  cardWidth: number,
  cardHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 12,
  gap: number = 10
): HoverCardPosition {
  const safePadding = Math.max(0, padding);
  const safeGap = Math.max(0, gap);

  let left: number;
  let placement: 'right' | 'left';

  // Check if there is enough space to the right
  if (targetRect.right + safeGap + cardWidth <= viewportWidth - safePadding) {
    left = targetRect.right + safeGap;
    placement = 'right';
  } else if (targetRect.left - safeGap - cardWidth >= safePadding) {
    left = targetRect.left - safeGap - cardWidth;
    placement = 'left';
  } else {
    // Tight viewport: place where there is more room
    const roomRight = viewportWidth - targetRect.right;
    const roomLeft = targetRect.left;
    if (roomRight >= roomLeft) {
      left = Math.max(safePadding, viewportWidth - cardWidth - safePadding);
      placement = 'right';
    } else {
      left = safePadding;
      placement = 'left';
    }
  }

  // Vertical alignment & clamping
  let top = targetRect.top;
  if (top + cardHeight > viewportHeight - safePadding) {
    top = Math.max(safePadding, viewportHeight - cardHeight - safePadding);
  }
  top = Math.max(safePadding, top);

  return {
    top: Math.round(top),
    left: Math.round(left),
    placement
  };
}

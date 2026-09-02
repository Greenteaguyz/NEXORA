import { ContextMenuPosition } from './context-menu.model';

/**
 * Calculates deterministic, viewport-bounded coordinates for a context menu popover.
 * Ensures the popover flips inward if it would otherwise breach the right or bottom viewport edge.
 */
export function calculateContextMenuPosition(
  clickX: number,
  clickY: number,
  menuWidth: number,
  menuHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 8
): ContextMenuPosition {
  const safePadding = Math.max(0, padding);

  let left = clickX;
  let top = clickY;

  // Horizontal clamping / flipping
  if (clickX + menuWidth > viewportWidth - safePadding) {
    // Attempt flip left of click, otherwise clamp to viewport edge
    const flippedLeft = clickX - menuWidth;
    left = flippedLeft >= safePadding ? flippedLeft : Math.max(safePadding, viewportWidth - menuWidth - safePadding);
  } else {
    left = Math.max(safePadding, left);
  }

  // Vertical clamping / flipping
  if (clickY + menuHeight > viewportHeight - safePadding) {
    // Attempt flip above click, otherwise clamp to viewport edge
    const flippedTop = clickY - menuHeight;
    top = flippedTop >= safePadding ? flippedTop : Math.max(safePadding, viewportHeight - menuHeight - safePadding);
  } else {
    top = Math.max(safePadding, top);
  }

  return {
    left: Math.round(left),
    top: Math.round(top)
  };
}

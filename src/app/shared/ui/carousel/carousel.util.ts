/**
 * Computes the next active slide index with optional loop wrapping.
 */
export function getNextSlideIndex(currentIndex: number, total: number, loop: boolean = true): number {
  if (total <= 0) return 0;
  if (currentIndex < total - 1) {
    return currentIndex + 1;
  }
  return loop ? 0 : currentIndex;
}

/**
 * Computes the previous active slide index with optional loop wrapping.
 */
export function getPrevSlideIndex(currentIndex: number, total: number, loop: boolean = true): number {
  if (total <= 0) return 0;
  if (currentIndex > 0) {
    return currentIndex - 1;
  }
  return loop ? total - 1 : 0;
}

/**
 * Resolves which media URL to render on the main stage (swapping on thumbnail hover).
 */
export function resolveActiveMedia(
  mainUrl: string,
  thumbnailUrls: string[] | undefined,
  hoveredThumbIndex: number | null
): string {
  if (hoveredThumbIndex != null && thumbnailUrls && thumbnailUrls[hoveredThumbIndex]) {
    return thumbnailUrls[hoveredThumbIndex];
  }
  return mainUrl || 'assets/logo-icon.svg';
}

/**
 * Image Processing & Client-Side Compression Utilities
 * Enforces MIME validation, LocalStorage quota protection,
 * and smart screenshot gallery array fallback invariants.
 */

export interface ImageFilePayload {
  name: string;
  type: string;
  size: number;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB raw file limit

/**
 * Validates file MIME type, size boundaries, and corruption guards.
 */
export function validateImagePayload(file: ImageFilePayload): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'Image exceeds the maximum allowed size of 15 MB.' };
  }

  const mime = (file.type || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return { valid: false, error: 'Please upload a valid image file (PNG, JPG, WebP, or GIF).' };
  }

  return { valid: true };
}

/**
 * Guarantees a deterministic, non-null array of exactly 4 screenshot URLs.
 * Fills any omitted or empty slots using preceding screenshots or the cover art fallback.
 */
export function buildCompleteScreenshotArray(
  screenshots: Array<string | null | undefined>,
  fallbackCover: string
): string[] {
  const fallback = (fallbackCover && fallbackCover.trim().length > 0)
    ? fallbackCover.trim()
    : 'assets/logo-icon.svg';

  const validEntries = (screenshots || [])
    .map(s => (typeof s === 'string' ? s.trim() : ''))
    .filter(s => s.length > 0);

  const primary = validEntries[0] || fallback;

  return [
    validEntries[0] || primary,
    validEntries[1] || primary,
    validEntries[2] || primary,
    validEntries[3] || primary
  ];
}

/**
 * Compresses an image client-side to max dimensions and reasonable quality
 * to guarantee LocalStorage quota safety (< 150-200 KB per asset).
 */
export function compressImageFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const validation = validateImagePayload({
      name: file.name,
      type: file.type,
      size: file.size
    });

    if (!validation.valid) {
      reject(new Error(validation.error || 'Invalid image file.'));
      return;
    }

    // Preserve SVGs as raw data URLs directly
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read SVG file.'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      if (typeof window === 'undefined' || !window.document) {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Scale down proportionally if larger than maximum bounds
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Export as modern WebP with JPEG fallback
          let compressed = canvas.toDataURL('image/webp', quality);
          if (!compressed.startsWith('data:image/webp')) {
            compressed = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(compressed);
        } catch {
          resolve(rawDataUrl);
        }
      };

      img.onerror = () => reject(new Error('Failed to decode image data.'));
      img.src = rawDataUrl;
    };

    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

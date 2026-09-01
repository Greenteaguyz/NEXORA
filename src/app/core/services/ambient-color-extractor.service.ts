import { Injectable } from '@angular/core';
import { AmbientPalette, GAME_AMBIENT_PALETTES, GENRE_AMBIENT_PALETTES, PAGE_AMBIENT_PALETTES } from '../constants/game-palettes';
import { Game } from '../models/game.model';

interface HslColor {
  h: number; // 0 - 360
  s: number; // 0 - 1
  l: number; // 0 - 1
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

@Injectable({
  providedIn: 'root'
})
export class AmbientColorExtractorService {
  private cache = new Map<string, AmbientPalette>();

  /**
   * Resolves ambient palette using 3-tier smart hybrid logic:
   * Tier 1: Instant curated signature palette (0ms delay)
   * Tier 2: Asynchronous image auto-extraction with Steam vibrancy boost
   * Tier 3: Genre / category harmonic fallback
   */
  getPaletteForGame(game: Game | null | undefined): AmbientPalette {
    if (!game) {
      return PAGE_AMBIENT_PALETTES['catalog'];
    }

    // Tier 1: Instant signature palette check
    if (GAME_AMBIENT_PALETTES[game.id]) {
      return GAME_AMBIENT_PALETTES[game.id];
    }

    // Tier 2: In-memory cache check for extracted image palette
    const imageUrl = game.coverImageUrl || (game.screenshotUrls && game.screenshotUrls[0]);
    if (imageUrl && this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }

    // Trigger async extraction in the background for custom creator games
    if (imageUrl && typeof window !== 'undefined') {
      this.extractFromImageAsync(imageUrl, game.tags?.[0]);
    }

    // Tier 3: Genre fallback while loading or on failure
    return this.getFallbackPalette(game.tags?.[0]);
  }

  /**
   * Asynchronously extracts dominant vibrant hues from an image URL.
   */
  async extractFromImageAsync(imageUrl: string, fallbackTag?: string): Promise<AmbientPalette> {
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }

    try {
      const palette = await this.sampleImageCanvas(imageUrl);
      this.cache.set(imageUrl, palette);
      return palette;
    } catch {
      const fallback = this.getFallbackPalette(fallbackTag);
      this.cache.set(imageUrl, fallback);
      return fallback;
    }
  }

  /**
   * Samples a downscaled 16x16 canvas to find the top 2 dominant saturated hues.
   */
  private sampleImageCanvas(imageUrl: string): Promise<AmbientPalette> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            return resolve(this.getFallbackPalette());
          }

          // Sample 16x16 downscaled raster for sub-millisecond execution
          canvas.width = 16;
          canvas.height = 16;
          ctx.drawImage(img, 0, 0, 16, 16);

          const imgData = ctx.getImageData(0, 0, 16, 16).data;
          const samples: HslColor[] = [];

          for (let i = 0; i < imgData.length; i += 4) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            const a = imgData[i + 3];

            // Ignore transparent or near-black background pixels
            if (a < 128 || (r < 25 && g < 25 && b < 25)) continue;

            const hsl = this.rgbToHsl(r, g, b);
            // Prioritize vibrant pixels (saturation > 25%, lightness between 15% and 85%)
            if (hsl.s > 0.25 && hsl.l > 0.15 && hsl.l < 0.85) {
              samples.push(hsl);
            }
          }

          if (samples.length === 0) {
            return resolve(this.getFallbackPalette());
          }

          // Sort samples by vibrancy (saturation * non-extreme lightness)
          samples.sort((a, b) => (b.s * (1 - Math.abs(b.l - 0.5))) - (a.s * (1 - Math.abs(a.l - 0.5))));

          // Primary: Top vibrant hue, boosted and normalized
          const primaryHsl = samples[0];
          const boostedPrimary = this.boostVibrancy(primaryHsl);
          const primaryRgb = this.hslToRgb(boostedPrimary.h, boostedPrimary.s, boostedPrimary.l);

          // Secondary: A distinct contrasting hue or shifted accent
          let secondaryHsl = samples.find(s => Math.abs(s.h - primaryHsl.h) > 40) || {
            h: (primaryHsl.h + 45) % 360,
            s: primaryHsl.s,
            l: primaryHsl.l
          };
          const boostedSecondary = this.boostVibrancy(secondaryHsl);
          const secondaryRgb = this.hslToRgb(boostedSecondary.h, boostedSecondary.s, boostedSecondary.l);

          const palette: AmbientPalette = {
            primary: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.28)`,
            secondary: `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.20)`
          };

          canvas.width = 0;
          canvas.height = 0;
          resolve(palette);
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = (err) => reject(err);
      img.src = imageUrl;
    });
  }

  /**
   * Steam Vibrancy Booster: Boosts saturation to >= 65% and clamps lightness to 35%-60%
   * to guarantee luminous, energetic gaming glows without muddy grays or blinding whites.
   */
  boostVibrancy(hsl: HslColor): HslColor {
    return {
      h: Math.round(hsl.h),
      s: Math.min(Math.max(hsl.s * 1.35, 0.65), 0.95), // Boost saturation to vibrant gaming range
      l: Math.min(Math.max(hsl.l, 0.38), 0.58)          // Clamp lightness for rich contrast
    };
  }

  /**
   * Convert RGB (0-255) to HSL (h: 0-360, s: 0-1, l: 0-1)
   */
  rgbToHsl(r: number, g: number, b: number): HslColor {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: Math.round(h * 360), s, l };
  }

  /**
   * Convert HSL (h: 0-360, s: 0-1, l: 0-1) to RGB (0-255)
   */
  hslToRgb(h: number, s: number, l: number): RgbColor {
    h = (h % 360 + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  private getFallbackPalette(tag?: string): AmbientPalette {
    if (tag && GENRE_AMBIENT_PALETTES[tag]) {
      return GENRE_AMBIENT_PALETTES[tag];
    }
    return PAGE_AMBIENT_PALETTES['catalog'];
  }
}

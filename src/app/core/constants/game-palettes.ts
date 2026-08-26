export interface AmbientPalette {
  primary: string;
  secondary: string;
}

/**
 * Signature game ambient palettes tailored to game theme, artwork, and mood.
 */
export const GAME_AMBIENT_PALETTES: Record<string, AmbientPalette> = {
  // Marvel Rivals (Heroic Action: Electric Cyan + Golden Amber)
  game_001: {
    primary: 'rgba(102, 192, 244, 0.30)',
    secondary: 'rgba(245, 158, 11, 0.20)'
  },
  // Cyber Heist (Neo-Tokyo Cyberpunk: Radiant Magenta + Cyber Blue)
  game_002: {
    primary: 'rgba(236, 72, 153, 0.28)',
    secondary: 'rgba(59, 130, 246, 0.22)'
  },
  // Pixel Odyssey (Retro Adventure: Emerald Green + Indigo Violet)
  game_003: {
    primary: 'rgba(16, 185, 129, 0.24)',
    secondary: 'rgba(99, 102, 241, 0.20)'
  },
  // Shadow Circuit (Stealth Synthwave: Electric Violet + Deep Teal)
  game_004: {
    primary: 'rgba(139, 92, 246, 0.26)',
    secondary: 'rgba(6, 182, 212, 0.20)'
  }
};

/**
 * Category & Specialized Page Ambient Palettes
 */
export const PAGE_AMBIENT_PALETTES: Record<string, AmbientPalette> = {
  // Catalog Default Storefront
  catalog: {
    primary: 'rgba(102, 192, 244, 0.28)',
    secondary: 'rgba(99, 102, 241, 0.18)'
  },
  // Wishlist: Steam Electric Cyan + Wishlist Radiant Rose
  wishlist: {
    primary: 'rgba(244, 63, 94, 0.24)',
    secondary: 'rgba(102, 192, 244, 0.20)'
  },
  // Library: Steam Trophy Blue + Victory Emerald
  library: {
    primary: 'rgba(0, 120, 212, 0.26)',
    secondary: 'rgba(16, 185, 129, 0.18)'
  },
  // Creator Studio: Workbench Golden Amber + Electric Cyan
  studio: {
    primary: 'rgba(245, 158, 11, 0.24)',
    secondary: 'rgba(102, 192, 244, 0.18)'
  },
  // Profile: Persona Steam Blue + Deep Indigo
  profile: {
    primary: 'rgba(102, 192, 244, 0.22)',
    secondary: 'rgba(99, 102, 241, 0.16)'
  },
  // Genres / Category Hub: Cyber Indigo + Cyan
  genres: {
    primary: 'rgba(99, 102, 241, 0.25)',
    secondary: 'rgba(6, 182, 212, 0.20)'
  },
  // 404 Error: Deep Space Glitch Violet + Cyan
  notfound: {
    primary: 'rgba(139, 92, 246, 0.30)',
    secondary: 'rgba(102, 192, 244, 0.22)'
  }
};

/**
 * Genre-specific ambient palette mapping
 */
export const GENRE_AMBIENT_PALETTES: Record<string, AmbientPalette> = {
  Action: { primary: 'rgba(239, 68, 68, 0.24)', secondary: 'rgba(245, 158, 11, 0.18)' },
  RPG: { primary: 'rgba(16, 185, 129, 0.24)', secondary: 'rgba(99, 102, 241, 0.20)' },
  Cyberpunk: { primary: 'rgba(236, 72, 153, 0.28)', secondary: 'rgba(6, 182, 212, 0.22)' },
  SciFi: { primary: 'rgba(6, 182, 212, 0.26)', secondary: 'rgba(99, 102, 241, 0.20)' },
  Shooter: { primary: 'rgba(245, 158, 11, 0.24)', secondary: 'rgba(102, 192, 244, 0.20)' },
  Strategy: { primary: 'rgba(59, 130, 246, 0.26)', secondary: 'rgba(16, 185, 129, 0.18)' },
  Indie: { primary: 'rgba(168, 85, 247, 0.25)', secondary: 'rgba(236, 72, 153, 0.18)' },
  Adventure: { primary: 'rgba(20, 184, 166, 0.25)', secondary: 'rgba(59, 130, 246, 0.18)' }
};

/**
 * Resolves ambient palette for a given game ID, genre tag, or fallback.
 */
export function getGameAmbientPalette(gameId?: string, tag?: string): AmbientPalette {
  if (gameId && GAME_AMBIENT_PALETTES[gameId]) {
    return GAME_AMBIENT_PALETTES[gameId];
  }
  if (tag && GENRE_AMBIENT_PALETTES[tag]) {
    return GENRE_AMBIENT_PALETTES[tag];
  }
  return PAGE_AMBIENT_PALETTES['catalog'];
}

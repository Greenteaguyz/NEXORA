# NEXORA Design System (DESIGN.md)
*Standardized on the Steam DesignMD Specification & Impeccable Craft Framework*

---

## 1. Design Philosophy: The Impeccable Standard

NEXORA adheres to the **Impeccable Standard**: high-utility, media-first desktop gaming storefront aesthetics inspired by Valve's Steam client and modern high-craft design engineering.

* **Media-First**: Games are visual art. 16:9 gameplay footage and crisp high-resolution screenshots take precedence over decorative UI.
* **Restrained & Solid**: Matte slate surfaces (`#0E141B`, `#1B2838`, `#2A475E`), crisp 1px borders, zero blurry neon glow halos.
* **Deterministic Semantic Color**:
  * **Steam Green (`#75B022` / `#588A1B`)**: Reserved strictly for Primary Action CTAs (`Buy`, `Download`, `Add to Library`, `View Details`).
  * **Steam Cyan (`#66C0F4`)**: Reserved strictly for interactive hyperlinks, active navigation tabs, and review sentiments.
  * **Rose (`#F43F5E`)**: Reserved strictly for Wishlist actions and destructive alerts.
* **Fast & Snappy**: Snappy `0.15s ease` transitions; zero wobbly rubber-band spring curves.

---

## 2. Color Tokens (CSS Custom Properties)

```css
:root {
  /* Canvas & Dark Surfaces */
  --bg-void:          #0A0E13; /* Deepest canvas */
  --bg-surface:       #16202D; /* Card & container surface */
  --bg-elevated:      #1B2838; /* Modal & popover elevation */
  --bg-input:         #0E141B; /* Text input & search surface */

  /* Text & Hierarchy */
  --text-primary:     #F8FAFC; /* Primary headings (18:1 contrast) */
  --text-secondary:   #C7D5E0; /* Body descriptions (12:1 contrast) */
  --text-muted:       #8F98A0; /* Metadata & tags (7:1 contrast) */

  /* Semantic Brand Accents */
  --accent-400:       #66C0F4; /* Steam Blue / Cyan */
  --accent-500:       #1999D6; /* Deep Steam Cyan */
  --emerald-400:      #A4D007; /* Free-to-play green */
  --rose-500:         #F43F5E; /* Wishlist radiant rose */

  /* Buttons */
  --steam-btn-gradient: linear-gradient(to right, #75B022 5%, #588A1B 95%);
  --steam-btn-hover:    linear-gradient(to right, #8ED629 5%, #6AA621 95%);

  /* Borders & Shadows */
  --border-card:      #2A475E; /* Steam Steel border */
  --border-subtle:    rgba(102, 192, 244, 0.15);
  --border-glow:      #66C0F4;
  --shadow-card:      0 4px 16px rgba(0, 0, 0, 0.45);
}
```

---

## 3. Typography Hierarchy & Fluid CSS `clamp()` Scale

* **Display Headings**: `font-family: var(--font-display); font-size: clamp(1.15rem, 1.6vw, 1.45rem); font-weight: 800; letter-spacing: -0.02em;`
* **Monospace Flagship Eyebrow**: `font-family: var(--font-mono); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-400);`
* **Body / Descriptions**: `font-family: var(--font-sans); font-size: 0.925rem; line-height: 1.55; color: var(--text-secondary);`
* **Price Values (Paid)**: `font-family: var(--font-mono); font-weight: 800; font-size: 1.2rem; color: var(--text-primary);`
* **Price Values (Free)**: `font-family: var(--font-sans); font-weight: 800; font-size: 1.15rem; color: #75B022;`

---

## 4. Geometry & Radii Scale

```css
--radius-xs:  2px;   /* Tag chips, micro status pills, review sentiment badge */
--radius-sm:  4px;   /* Utility icon buttons, screenshot thumbs */
--radius:     6px;   /* Main CTA buttons, search inputs */
--radius-lg:  8px;   /* Store cards, tables, panels */
--radius-xl:  12px;  /* Dialogs, featured containers */
--radius-2xl: 16px;  /* Modal shells */
```

---

## 5. Hero Carousel & Zero-Shift Media Architecture (0.00px CLS)

* **Decoupled Absolute Media Fill**:
  ```css
  .carousel-main-media {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .main-media-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  ```
* **Fixed 16:9 Resolution Contract**: All online seed and upload assets enforce `w=1280&h=720&auto=format&fit=crop&q=80` (16:9 widescreen).
* **Symmetrical 2x2 Thumbnail Tile Matrix**:
  ```css
  .mini-screenshots-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    width: 100%;
  }
  .mini-screenshot-thumb {
    width: 100%;
    aspect-ratio: 16 / 9;
    box-sizing: border-box;
  }
  ```

---

## 6. Omni-Resolution Grid Progression & Mobile Optimization

* **4/3/2/1 Column Progression**:
  * $\ge 1280px$: **4 columns** (`repeat(4, 1fr)`)
  * $960px - 1279px$: **3 columns** (`repeat(3, 1fr)`)
  * $600px - 959px$: **2 columns** (`repeat(2, 1fr)`)
  * $< 600px$: **1 column** (`1fr`)
* **Tablet / Mobile Hero Preview Strip**: On $\le 860px$, the 2x2 grid collapses into a sleek horizontal 1x4 preview strip (`repeat(4, 1fr)` with `max-height: clamp(44px, 10vw, 60px)`), reclaiming 180px+ vertical viewport height.

---

## 7. Clean Text-Only Category Filter Rail

* **Clean Category Chips**: Text-only category chips without noisy numeric badges (`[ 10 ]`).
* **Dual-Edge Fade Masks**: `mask-image: linear-gradient(to right, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%);`.
* **Smooth Chevron Paging**: Dedicated Left `<` and Right `>` smooth scroll chevrons (`scrollChips('left' | 'right')`).

---

## 8. Anti-Slop Guardrails (50+ Strict Checks)

1. ❌ **No Blurry Neon Glow**: Never use `box-shadow: 0 0 Xpx [color]` on cards or buttons.
2. ❌ **No SVG Filter Glows**: Never use `filter: drop-shadow(0 0 6px ...)` on vector icons.
3. ❌ **No Repetitive Icon Boxes**: Never place decorative 52px gradient squares beside page titles.
4. ❌ **No Rubber-Band Easing**: Never use `cubic-bezier(0.34, 1.56, 0.64, 1)`. Use `0.15s ease`.
5. ❌ **No Pseudo-Sci-Fi Copy**: Never use `DIRECT ACQUISITION`, `PREMIERE SHOWCASE`, or bracketed tags `[DRM-FREE]`.
6. ❌ **No Random Pill Buttons**: Never use `border-radius: 9999px` on administrative/utility buttons.

---

## 9. Speedtest Dual-Segment Theme Switcher Specification

* **Geometry**: `58px × 30px` pill container with `24px × 24px` sliding indicator thumb (`transform: translateX(28px)` in Dark mode; `translateX(0px)` in Light mode).
* **Coloration**:
  * **Sun Segment (Light Mode)**: Warm Amber (`#F59E0B`) with subtle golden specular glow.
  * **Moon Segment (Dark Mode)**: Electric Cyan (`#66C0F4`) with Steam Cyan specular glow.
* **Transition Motion**: Snappy `0.2s cubic-bezier(0.16, 1, 0.3, 1)` sliding thumb.

---

## 10. Unified Steam Deck Hub Mobile Navigation Architecture

* **Zero-Scroll Fit**: `36px` compact row height with `2px` vertical gaps; eliminates all vertical scrollbars on standard mobile viewports (`600px - 844px`).
* **Integrated 2-Row Footer Control Card**:
  * **Row 1**: User avatar (`30px`), display name, role badge (`CREATOR`/`BUYER`), and squircle logout button.
  * **Row 2**: Speedtest Theme Switcher on the left, Persona segmented capsule `[ Alice | Bob ]` on the right.
* **Pixel-Aligned Grid**: Icons centered in `17px × 17px` bounding boxes, labels aligned on uniform `10px` left margin, and category headers sharing identical baseline alignment.
* **Accessibility**: Keyboard focus trapping (`Tab`/`Shift+Tab`), auto-focus on close button on open, `Escape` key dismissal, and `env(safe-area-inset-bottom)` device padding.

---

## 11. Hero Carousel Motion, Gesture & Pagination Architecture

* **Hardware-Accelerated Crossfade**: Main media screenshot executes dual-phase opacity crossfade (`0.82 -> 1.0`) with subtle scale settle (`scale(1.012) -> scale(1.0)`) over `0.35s cubic-bezier(0.16, 1, 0.3, 1)`.
* **Coordinated Info Reveal**: Game title, tags, status badge, and preview thumbnails micro-rise `4px` with synchronized opacity fade over `0.28s cubic-bezier(0.16, 1, 0.3, 1)`.
* **Touch & Pointer Drag-to-Swipe**:
  * `40px` minimum horizontal threshold with angle lock (`Math.abs(deltaX) > Math.abs(deltaY)`).
  * `< 6px` movement recognized as clean tap/click for instant router navigation.
  * `touch-action: pan-y;` guarantees 0 interference with vertical page scrolling.
  * Tactile `cursor: grab` and `cursor: grabbing` desktop mouse cues.
* **Minimalist Electric Cyan Pagination Bar**:
  * Centered pill indicators inside frosted glass dock (`padding: 4px 10px; backdrop-filter: blur(8px)`).
  * Fluid pill expansion (`24px -> 38px`) over `0.32s cubic-bezier(0.16, 1, 0.3, 1)` with Electric Cyan luminous indicator.
* **Keyboard Spatial Navigation**: Native `ArrowLeft` / `ArrowRight` arrow key shortcuts for instant slide traversal.
* **Accessibility & Reduced Motion**: `@media (prefers-reduced-motion: reduce)` bypasses all transforms and sets animation duration to `0.01ms`.

---

## 12. Smart Scroll-Aware Header & Safe-Area Mobile Clearance

* **Smart Scroll-Aware Header**:
  * **Downward Scroll (`deltaY > 8px` & `scrollY > 60px`)**: Header smoothly slides out of view (`transform: translateY(-100%)`) over `0.25s cubic-bezier(0.16, 1, 0.3, 1)`.
  * **Upward Scroll (`deltaY < -8px`)**: Header glides immediately back into view (`transform: translateY(0)`).
  * **Top-of-Page Absolute Pinning (`scrollY <= 10px`)**: Header is permanently visible and never dismissed.
  * **Modal & Drawer Lock**: Auto-hiding is strictly suppressed while navigation drawer or command palette is active.
* **Footer Legal Text Clearance**:
  * On viewports $\le 768px$, `.footer-shell` enforces `padding-bottom: calc(var(--space-8) + 64px + env(safe-area-inset-bottom, 0px))`, providing over `88px–122px` buffer above the fixed mobile bar.
* **Mobile Bottom Bar Safe-Area Ergonomics**:
  * `padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px))` preserves icon spacing on iPhone and Android gesture navigation bars.
  * **Luminous Active Indicator**: Active tab features a centered Electric Cyan (`#66C0F4`) glowing pill indicator (`width: 32px; height: 3px; box-shadow: 0 0 8px rgba(102, 192, 244, 0.6)`).
  * **Tactile Feedback**: Immediate `scale(0.95)` press feedback with zero tap delay (`touch-action: manipulation`).

---

## 13. Store Context Menu Specification (`appContextMenu`)

* **Aesthetic**: Matte dark slate surface (`#16202D`), 1px steel border (`#2A475E`), and crisp drop shadow.
* **Viewport Clamping**: `calculateContextMenuPosition()` dynamically flips the menu leftwards/upwards when clicked within 200px of viewport boundaries with a 12px safety padding.
* **Accessibility**: `role="menu"`, `role="menuitem"`, arrow key navigation (<kbd>↑</kbd>/<kbd>↓</kbd>), <kbd>Escape</kbd> dismissal, and backdrop click outside closing.
* **Actions**: Unowned game cards display *View Store Page*, *Wishlist*, and *Copy Store Link*; owned games prefix *Play / Download Game*.

---

## 14. Game Hover Card Popover Specification (`appHoverCard`)

* **Fast Debounce**: `300ms` hover entrance delay with instant cancellation on pointer exit.
* **16:9 Media Cycling**: Auto-cycles gameplay screenshots every 2.5 seconds with Steam Cyan indicator dots.
* **Content Hierarchy**: Game title, developer name, Steam review sentiment (*Very Positive — 89%*), and `#tag` chips.
* **SSR Safety**: All coordinate measurements are guarded with `isPlatformBrowser(platformId)`.

---

## 15. Creator Studio Data Table (`DataTableComponent`)

* **DesignMD Matte Surface**: `#16202D` surface with `#2A475E` steel borders and high contrast typography.
* **Search & Sort**: Case-insensitive substring filtering across title/tags, sortable column headers with active directional SVG arrows, and tabular numeral cell formatting.
* **Responsive Pagination**: Steam-styled pagination bar with records range indicator (`Showing 1 - 10 of 24`) and Prev / Next controls.

---

## 16. Store Showcase Carousel (`CarouselComponent`)

* **16:9 Cinema Stage**: High-resolution gameplay backdrop with zero layout shift.
* **4-Thumbnail Filmstrip**: Hovering any of the 4 thumbnails previews the screenshot on the main stage in real time.
* **Autoplay & Navigation**: 5-second interval timer with pause-on-hover and pause-on-focus, plus keyboard arrow navigation (<kbd>←</kbd> / <kbd>→</kbd>).

---

## 17. Smooth Fluid Clamping Scales

* **Linear-Slope Interpolation Formula**:
  `clamp(MIN_PX, calc(MIN_REM + SLOPE_VW), MAX_PX)`
* **Standardized Tokens**:
  * `--fluid-text-hero`: `clamp(2rem, 1.4rem + 2.5vw, 3.5rem)`
  * `--fluid-text-h1`: `clamp(1.75rem, 1.25rem + 2vw, 2.75rem)`
  * `--fluid-text-h2`: `clamp(1.35rem, 1.05rem + 1.4vw, 2.1rem)`
  * `--fluid-text-h3`: `clamp(1.1rem, 0.95rem + 0.8vw, 1.55rem)`
  * `--fluid-page-pad-x`: `clamp(16px, 0.75rem + 1.8vw, 48px)`
  * `--fluid-page-pad-y`: `clamp(16px, 0.75rem + 1.5vw, 40px)`
  * `--fluid-grid-gap`: `clamp(14px, 0.7rem + 1vw, 28px)`



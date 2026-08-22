# NEXORA Design System (DESIGN.md)
*Standardized on the Steam DesignMD Specification & Impeccable Craft Framework*

---

## 1. Design Philosophy: The Impeccable Standard

NEXORA adheres to the **Impeccable Standard**: high-utility, media-first desktop gaming storefront aesthetics inspired by Valve's Steam client and modern high-craft design engineering.

* **Media-First**: Games are visual art. 16:9 gameplay footage and crisp high-resolution screenshots take precedence over decorative UI.
* **Restrained & Solid**: Matte slate surfaces (`#0E141B`, `#1B2838`, `#2A475E`), crisp 1px borders, zero blurry neon glow halos.
* **Deterministic Semantic Color**:
  * **Steam Green (`#75B022` / `#588A1B`)**: Reserved strictly for Primary Action CTAs (`Buy`, `Download`, `Add to Library`).
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

## 3. Typography Hierarchy

* **Display Headings**: `font-family: 'Motiva Sans', 'Inter', -apple-system, sans-serif; font-weight: 800; letter-spacing: -0.02em;`
* **Eyebrow Breadcrumbs**: `font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;`
* **Body / Copy**: `font-family: 'Inter', -apple-system, sans-serif; font-size: 0.925rem; line-height: 1.55;`
* **Price / Technical Specs**: `font-family: 'JetBrains Mono', monospace; font-weight: 800;`

---

## 4. Geometry & Radii Scale

```css
--radius-xs:  2px;   /* Tag chips, micro status pills */
--radius-sm:  4px;   /* Utility icon buttons, screenshot thumbs */
--radius:     6px;   /* Main CTA buttons, search inputs */
--radius-lg:  8px;   /* Store cards, tables, panels */
--radius-xl:  12px;  /* Dialogs, featured containers */
--radius-2xl: 16px;  /* Modal shells */
```

---

## 5. Anti-Slop Guardrails (50+ Strict Checks)

1. ❌ **No Blurry Neon Glow**: Never use `box-shadow: 0 0 Xpx [color]` on cards or buttons.
2. ❌ **No SVG Filter Glows**: Never use `filter: drop-shadow(0 0 6px ...)` on vector icons.
3. ❌ **No Repetitive Icon Boxes**: Never place decorative 52px gradient squares beside page titles.
4. ❌ **No Rubber-Band Easing**: Never use `cubic-bezier(0.34, 1.56, 0.64, 1)`. Use `0.15s ease`.
5. ❌ **No Pseudo-Sci-Fi Copy**: Never use `DIRECT ACQUISITION`, `PREMIERE SHOWCASE`, or bracketed tags `[DRM-FREE]`.
6. ❌ **No Random Pill Buttons**: Never use `border-radius: 9999px` on administrative/utility buttons.

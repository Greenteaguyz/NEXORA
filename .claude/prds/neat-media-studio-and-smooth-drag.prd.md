# PRD: Neat Media Studio Layout & Smooth Drag-and-Drop System

## Problem
In the Creator Studio game publishing and editing form ([`/studio/games/new`](http://localhost:4200/studio/games/new)), Section 4 ("Cover Artwork & Gallery Media") suffers from three major UX and design failures:
1. **Severe Grid Clutter & Text Collisions**: Long titles combined with adjacent secondary badges smashed together inside narrow 140px cards (`"2. WorldATMOSPHERE & Env"` and `"3. SystemsMECHANICS & UI"`).
2. **Asymmetric Dead-Space Void**: The left cover art card stretched vertically to match two stacked screenshot rows, creating a large, hollow black gap beneath the cover image.
3. **Broken & Jerky Drag-and-Drop**: The UI promised "Click or drop cover artwork", but lacked native drag-and-drop event listeners. Dragging files onto boxes did not trigger uploads and lacked smooth visual feedback, animated dropzones, and reliable file ingestion.

## Evidence
- Live screenshot audit (`pricing_and_readiness_1788014697456.png` & user-supplied screenshot) confirms severe text collision (`"2. WorldATMOSPHERE & Env"`).
- Grep search confirms `dragover`, `dragleave`, and `drop` event handlers were missing in `game-form.component.ts` and `game-form.component.html`.
- User confirmed preference: Clean Single-Word Focus (`1. Gameplay`, `2. World`, `3. Mechanics`, `4. Action`).

## Users
- **Primary**: Indie Game Creators publishing or updating games in NEXORA Creator Studio who need an intuitive, uncluttered, and responsive media publishing workspace.
- **Not for**: External cloud hosting or video/trailer uploads.

## Hypothesis
We believe that **arranging the media hub into a clean 2-tier hierarchy (Full-Width 16:9 Cover Hero + Balanced 2×2 Screenshot Gallery Grid) paired with crisp single-word slot names (`1. Gameplay`, `2. World`, `3. Mechanics`, `4. Action`) and smooth native HTML5 drag-and-drop interactions** will **eliminate text collisions, remove dead space, and make media uploading effortless, smooth, and enjoyable**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Visual Neatness | 0 overlapping text collisions | Computed element bounding boxes & visual verification |
| Short Slot Naming | 1 clean word per slot | Slot header titles: `1. Gameplay`, `2. World`, `3. Mechanics`, `4. Action` |
| Aspect Ratio Consistency | 100% fixed 16:9 frames | CSS aspect-ratio compliance across all 5 slots |
| Dead Space Void | 0px artificial vertical stretch | Cover hero matches exact 16:9 height with no black gap |
| Drag & Drop Smoothness | < 50ms drop response | Immediate `.drag-active` visual feedback and compressed dataURL assignment |
| Quality Gate | 100% GREEN pass | `npm run verify` (tests, master battery, impeccable anti-slop, build) |

## Scope
**MVP**
1. **Tier 1: Full-Width 16:9 Cover Hero Banner**:
   - Spans 100% width across the top of Section 4 with a fixed 16:9 banner frame (max-height: 260px).
   - Clear label: `Storefront Cover Artwork *`.
   - Clean, quiet hover controls: `[Replace]` and `[Clear]`, plus smooth URL toggle.
   - Eliminates the empty black void completely.
2. **Tier 2: Balanced 2×2 Screenshot Gallery Grid**:
   - 2 clean rows of 2 cards (`grid-template-columns: repeat(2, 1fr); gap: 16px;`).
   - Cards expand to ~330px width (more than 2.3× wider than the current 140px).
   - **Clean Single-Word Slot Titles**:
     - Slot 1: **`1. Gameplay *`**
     - Slot 2: **`2. World`**
     - Slot 3: **`3. Mechanics`**
     - Slot 4: **`4. Action`**
   - Completely removes the redundant second badge (`ATMOSPHERE`, `MECHANICS`, etc.) that collided with titles.
3. **Smooth Native Drag & Drop Engine**:
   - Event listeners on all 5 slots: `dragover`, `dragleave`, `drop`.
   - Prevent default browser behaviors (`preventDefault()`, `stopPropagation()`).
   - `.drag-active` state featuring smooth dashed cyan border (`#66C0F4`), subtle frosted glass overlay, and drop prompt icon.
   - Automatic client-side canvas compression on dropped images via `compressImageFile()`.
4. **Elimination of Redundant Duplicate Controls**:
   - Remove redundant `[Upload]` button inside clickable dropzones.
   - Clean empty prompt: *"Drop image or click to browse"*.
   - Streamline URL input without pushing card heights or creating jagged rows.

---
*Status: APPROVED FOR IMPLEMENTATION via /plan.*

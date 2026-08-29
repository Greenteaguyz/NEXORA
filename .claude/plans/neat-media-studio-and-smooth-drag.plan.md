# Plan: Fluid Clamp-Based Auto-Resizing Media Studio & Smooth Drag-and-Drop System

**Source PRD**: `.claude/prds/fluid-clamp-media-studio.prd.md`
**Key Requirements**:
1. Mathematical `clamp()` fluid responsive scaling across every screen form factor (mobile, laptop, 1080p, 1440p+).
2. Clean Single-Word Focus naming (`1. Gameplay`, `2. World`, `3. Mechanics`, `4. Action`).
3. Smooth Native HTML5 Drag & Drop with animated `.drag-active` dropzone feedback.
4. Elimination of redundant duplicate `[Upload]` buttons and empty black dead space voids.

**Target Area**: [`src/app/features/creator-studio/game-form/`](file:///c:/Users/User/Downloads/AngularProject/src/app/features/creator-studio/game-form/)
**Complexity**: Medium

---

## Fluid Mathematical Clamp Formulae

| Surface | Fluid Clamp Token | Behavior |
|---|---|---|
| Main Form vs Sidebar | `grid-template-columns: 1fr clamp(300px, 25vw, 380px);` | Proportional sidebar width without crushing the main form |
| Section 4 Gallery Grid | `repeat(auto-fit, minmax(clamp(240px, 20vw, 360px), 1fr))` | Adapts from 1-column on mobile (<640px) to balanced 2-column on desktop |
| Cover Hero Max Height | `max-height: clamp(200px, 22vw, 320px);` | Proportional 16:9 banner without giant vertical dead space |
| Grid Gaps | `gap: clamp(12px, 1.4vw, 20px);` | Seamless spacing scaling from 12px up to 20px |
| Card Padding | `padding: clamp(10px, 1.2vw, 18px);` | Compact padding on small screens, generous on large monitors |
| Slot Title Font Size | `font-size: clamp(0.8rem, 0.9vw, 0.95rem);` | Crisp, legible font scaling without line wrapping |
| Prompt Icon Size | `width: clamp(20px, 2.5vw, 32px); height: clamp(20px, 2.5vw, 32px);` | Scalable icons inside dropzone |

---

## Tasks

### Task 1: TypeScript Drag & Drop Engine (`game-form.component.ts`)
- Add `activeDragSlot = signal<string | null>(null);`
- Implement `onDragOver(event: DragEvent, slot: string)` with `event.preventDefault()` and `event.dataTransfer.dropEffect = 'copy'`.
- Implement `onDragLeave(event: DragEvent, slot: string)` with reset.
- Implement `onDrop(event: DragEvent, slot: 'cover' | 'ss1' | 'ss2' | 'ss3' | 'ss4')` to extract file, run through `compressImageFile(file)`, update form control, and emit preview signal.

### Task 2: HTML Template Structure (`game-form.component.html`)
- Re-architect Section 4:
  - Header: `4. Media & Screenshots`
  - **Tier 1 (Cover Hero Banner)**:
    - Full width 16:9 frame.
    - Drag events: `(dragover)`, `(dragleave)`, `(drop)`, `[class.drag-active]`.
    - Clean empty prompt: *"Drop cover image or click to browse"*.
    - Quiet hover overlay: `[Replace]` and `[Clear]`.
  - **Tier 2 (Balanced 2×2 Gameplay Gallery)**:
    - 2×2 fluid clamp grid.
    - Slot 1: **`1. Gameplay *`**
    - Slot 2: **`2. World`**
    - Slot 3: **`3. Mechanics`**
    - Slot 4: **`4. Action`**
    - Redundant secondary badges (`ATMOSPHERE`, `MECHANICS`, `MOMENT`) removed.
    - Duplicate `[Upload]` button removed.

### Task 3: CSS Geometry & Fluid Clamp Rules (`game-form.component.css`)
- Integrate fluid `clamp()` across:
  - `.form-layout-grid`: `grid-template-columns: 1fr clamp(300px, 25vw, 380px); gap: clamp(16px, 2vw, 32px);`
  - `.bento-cover-frame`: `aspect-ratio: 16 / 9; max-height: clamp(200px, 22vw, 320px);`
  - `.bento-screenshots-grid`: `display: grid; grid-template-columns: repeat(auto-fit, minmax(clamp(240px, 20vw, 360px), 1fr)); gap: clamp(12px, 1.4vw, 20px);`
  - `.bento-card`: `padding: clamp(10px, 1.2vw, 18px);`
  - `.bento-slot-title`: `font-size: clamp(0.8rem, 0.9vw, 0.95rem);`
- Style `.drag-active` state:
  - `border: 2px dashed var(--cyan-400);`
  - `background: rgba(6, 182, 212, 0.12);`
  - `box-shadow: 0 0 20px rgba(6, 182, 212, 0.25);`
  - `transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);`
  - `pointer-events: none` on prompt children to prevent dragleave flickering.

### Task 4: Full Quality Gate Verification
```bash
npm run test:integration
npm run verify
```
- Verify 106 integration tests pass.
- Verify Angular production build succeeds with 0 errors.

## Acceptance
- [ ] Every media frame, card padding, gap, and title smoothly resizes via `clamp()`.
- [ ] Slot titles are single-word: `1. Gameplay`, `2. World`, `3. Mechanics`, `4. Action`.
- [ ] Zero text overlap across all display sizes (1024px, 1366px, 1920px, 2560px).
- [ ] Zero empty black void under the cover art.
- [ ] Native HTML5 drag-and-drop works smoothly on all 5 slots with `.drag-active` feedback.
- [ ] `npm run verify` passes with 100% GREEN.

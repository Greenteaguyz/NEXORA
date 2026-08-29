# PRD: Fluid Clamp-Based Auto-Resizing Media Studio & Smooth Drag System

## Problem
In NEXORA Creator Studio ([`/studio/games/new`](http://localhost:4200/studio/games/new)), game publishing media slots use rigid, fixed pixel dimensions that break across diverse device form factors. On compact laptop viewports (e.g. 1024px–1366px), media thumbnails shrink down to ~140px width with severe text collisions (`"2. WorldATMOSPHERE & Env"`), while on 1440p/4K monitors they fail to take advantage of available screen real estate. Furthermore, the dropzones lack smooth fluid responsiveness and native HTML5 drag-and-drop event handling, resulting in a fragile, awkward uploading experience.

## Evidence
- User direct request: *"must arrange neatly and the drag box make it smoother"* and *"use clamp to auto resize on every screen form factor /plan-prd"*.
- Browser viewport audit at 1023px width (`Page 5092439631B92596EF3D17078B00BD44`) exhibits squished 140px cards with text truncation and badge collision.
- Existing CSS codebase uses fixed `14px`, `360px`, `1.15fr 1fr` without fluid boundary clamping (`clamp()`), causing jarring layout jumps between breakpoints.

## Users
- **Primary**: Indie Game Creators authoring game listings on any display form factor—ranging from compact laptops (1024px) to high-density desktop displays (1440p/4K)—who demand neat, proportional, and fluidly adapting media upload boxes.
- **Not for**: Video/stream encoding or external cloud file hosting.

## Hypothesis
We believe that **implementing mathematical `clamp(min, preferred, max)` fluid scaling across all media containers, grid tracks, typography, and gaps, combined with native HTML5 drag-and-drop feedback**, will **ensure media cards automatically resize with pixel-perfect neatness on every screen size without text overlap, dead-space voids, or jarring breakpoint reflows**. We will know we are right when **the media hub maintains strict 16:9 aspect ratios, provides zero text collision from 320px mobile to 2560px ultrawide, and delivers instant, smooth drag-and-drop visual states**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Responsive Geometry | 100% fluid `clamp()` tokens | Elimination of rigid hardcoded pixel widths for media columns |
| Text Collision Count | 0 collisions across all viewports | Element collision testing from 320px to 2560px |
| Aspect Ratio Precision | 16:9 locked (±0.5px) | CSS `aspect-ratio: 16 / 9` computed layout verification |
| Dropzone Responsiveness | < 50ms drop feedback | Immediate `.drag-active` transition and file compression |
| Quality Gate | 100% GREEN | `npm run verify` (build, unit, integration, anti-slop) |

## Scope
**MVP**
1. **Fluid Clamp Architecture for Section 4**:
   - **Cover Hero Frame**: `width: 100%; aspect-ratio: 16 / 9; max-height: clamp(200px, 22vw, 320px);`
   - **Screenshots 2×2 Grid**: `grid-template-columns: repeat(auto-fit, minmax(clamp(240px, 20vw, 360px), 1fr)); gap: clamp(12px, 1.4vw, 20px);`
   - **Card Internal Padding**: `padding: clamp(10px, 1.2vw, 18px);`
   - **Dynamic Typography**: `font-size: clamp(0.8rem, 0.9vw, 0.95rem);` for titles; `clamp(0.65rem, 0.75vw, 0.725rem);` for badges.
   - **Main Form & Sidebar Split**: `grid-template-columns: 1fr clamp(300px, 25vw, 380px);`
2. **Neat Single-Word Hierarchy**:
   - Section Title: `4. Media & Screenshots`
   - Tier 1 Header: `Storefront Cover Artwork *`
   - Tier 2 Grid: `1. Gameplay *`, `2. World`, `3. Mechanics`, `4. Action`
   - Zero secondary badge text collision (`white-space: nowrap; flex-shrink: 0`).
3. **Smooth Native Drag & Drop Engine**:
   - Native HTML5 event handlers: `(dragover)`, `(dragleave)`, `(drop)` across all 5 slots.
   - `.drag-active` state featuring animated dashed cyan border (`border: 2px dashed #66C0F4`), subtle frosted overlay, and drop prompt.
   - Client-side canvas compression pipeline via `compressImageFile()`.
4. **Duplicate Control Elimination**:
   - Clickable dropzone card replaces redundant overlaid `[Upload]` button.
   - Non-destructive URL toggle that preserves 16:9 card heights.

**Out of scope**
- Multi-file bulk upload into a single slot (each slot receives its target asset).
- Heavy animation libraries or spring physics (must adhere to Steam DesignMD 0.15s ease and 0px grounded translateY rules).

## Delivery Milestones
<!-- Status: pending | in-progress | complete -->

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Fluid Clamp Geometry & PRD | Establish mathematical clamp tokens across layout & typography | in-progress | `.claude/plans/neat-media-studio-and-smooth-drag.plan.md` |
| 2 | Smooth Native Drag-and-Drop Pipeline | Implement dragover/dragleave/drop handlers with `.drag-active` states | pending | — |
| 3 | Clean 2-Tier Template & Short Naming | Full-width Cover Hero + 2x2 Screenshot Grid with 1-word titles | pending | — |
| 4 | Quality Gate & Cross-Device Verification | Validate across mobile, laptop (1024px), desktop, and `npm run verify` | pending | — |

## Open Questions
- None. User directives aligned: fluid `clamp()` across all screen form factors, neat arrangement with single-word titles, and smooth native drag boxes.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Card dropping below min width on narrow mobile | Low | Medium | `minmax(clamp(240px, ...))` wraps cleanly into a single full-width column on mobile (<640px) |
| Dragover bubbling causing child flicker | Medium | Low | Set `pointer-events: none` on prompt children inside `.bento-media-frame` |
| Large dropped photos exhausting LocalStorage quota | High | High | `compressImageFile()` clamps images to max 1280px at 85% quality (< 150KB) |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

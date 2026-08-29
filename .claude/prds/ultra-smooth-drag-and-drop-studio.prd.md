# PRD: Ultra-Smooth Native Drag-and-Drop Dropzone Engine

## Problem
While drag-and-drop events were wired to the 5 media slots, drag interactions can suffer from three friction points in desktop browsers:
1. **Child Element Flicker**: Rapid cursor movements over text, icons, and nested elements trigger interleaved `dragenter`/`dragleave` events, causing the `.drag-active` state to jitter or abruptly turn off mid-drag.
2. **Window Drop Hijacking Risk**: If a creator accidentally releases an image outside the exact boundary of a slot, browsers by default attempt to open the dropped file in the current tab, navigating away from the page and terminating the form session.
3. **Transition & Feedback Rigidity**: The active drop visual feedback needs smoother, grounded transitions (Steam cyan border glow, frosted inner backdrop, and subtle icon pulse) without violating the 0px translateY grounded hover rule.

## Evidence
- User directive: *"also fix the drag box to be smoother /plan-prd"*.
- Browser HTML5 Drag & Drop specification: child elements inside drag targets fire bubbling `dragleave` events unless handled with an enter-count state machine or strict pointer-event isolation.

## Users
- **Primary**: Game creators uploading game covers and screenshot media who expect instant, buttery smooth, and resilient drag-and-drop mechanics identical to native desktop apps.
- **Not for**: Public store users.

## Hypothesis
We believe that **implementing a robust nested-drag counter state machine, global window drop neutralization, and refined Steam DesignMD transitions (subtle inner cyan glow, smooth cubic-bezier easing, zero-lift grounding)** will **eliminate all dropzone flickering, prevent accidental browser navigations, and provide a buttery smooth, professional uploading experience**. We will know we are right when **dragging any file anywhere over the slots produces stable, jitter-free visual feedback and dropping immediately ingests the image cleanly**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Dropzone Flicker Rate | 0 flickering frames | Drag traversal testing over child icons and text |
| Mis-Drop Page Navigation | 0 accidental page unloads | Global `window:drop` / `window:dragover` preventDefault guard |
| Visual Transition Smoothness | Snappy 0.18s cubic-bezier | CSS transition profile conforming to Steam DesignMD |
| Drop Processing Latency | < 50ms to preview | Time from `drop` event to canvas dataURL assignment |
| Quality Gate | 100% GREEN | `npm run verify` |

## Scope
**MVP**
1. **Flicker-Free Drag Counter State Machine**:
   - Maintain a per-slot drag entry counter (`dragCounts[slot]`).
   - `dragenter`: increment counter; activate `.drag-active` on count === 1.
   - `dragleave`: decrement counter; deactivate only when count <= 0.
   - `drop`: reset counter to 0 and deactivate immediately.
2. **Global Window Drop Protection**:
   - Prevent default browser navigation on `dragover` and `drop` outside drop targets so missed drops never unload the page.
3. **Smooth Steam Aesthetics & Grounded Transitions**:
   - Border: `2px dashed var(--accent-400, #66C0F4)`.
   - Subtle inner glow: `box-shadow: 0 0 20px rgba(102, 192, 244, 0.2), inset 0 0 14px rgba(102, 192, 244, 0.08);`.
   - Background: `rgba(102, 192, 244, 0.08)`.
   - Strict Grounded Rule: 0px `translateY` (no floating lift effects per `AGENTS.md`).
   - Child elements: set `pointer-events: none` on all prompt labels and icons.
4. **Pristine Drop & Paste Handling**:
   - Validate MIME types (`image/*`).
   - Canvas compression pipeline (<150KB base64).
   - Clear feedback toast upon successful ingestion.

**Out of scope**
- Multi-file bulk upload to a single slot.
- Video file processing.

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | PRD & Requirements | Establish flicker-free counter, window safety, and visual polish | complete | `.claude/prds/ultra-smooth-drag-and-drop-studio.prd.md` |
| 2 | Implementation Plan | Detail TypeScript drag counter and CSS polish | complete | `implementation_plan.md` |
| 3 | Execution | Implement drag counter, global window listeners, and CSS transitions | pending | — |
| 4 | Verification | Verify 100% GREEN in `npm run verify` | pending | — |

---
*Status: APPROVED — Implementation pending via /plan.*

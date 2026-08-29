# Creator Studio: 1 Cover + 4 Screenshots Media Upload System

## Problem
Currently in NEXORA Creator Studio (`/studio/games/new` and `/studio/games/:id/edit`), creators can only provide a single cover image URL via manual text input. The 4 gameplay screenshots that power the public game showcase gallery ([`/games/:id`](http://localhost:4200/games/game_001)) are hardcoded behind the scenes. Furthermore, creators must manually locate and copy online image URLs instead of directly uploading their own local game assets from their computers, creating unnecessary friction, incomplete showcases, and a broken creator publishing workflow.

## Evidence
- **Current Hardcoded Behavior**: `game-form.component.ts` hardcodes `screenshotUrls: [formVal.coverImageUrl, 'assets/games/game-1-shot1.svg', 'assets/games/game-1-shot2.svg']`, ignoring actual game artwork and restricting real visual showcase.
- **Observed Creator Workflow Barrier**: Developers have screenshots and promotional capsules saved as local files (`.png`, `.jpg`, `.webp`) on their disks; requiring hosted web URLs forces unnatural external hosting workarounds.
- **Storage Feasibility**: `profile.component.ts` successfully implements client-side `FileReader.readAsDataURL` with canvas compression, proving local storage persistence is efficient, fast, and safe.

## Users
- **Primary**:
  - **Indie Game Creators**: Publishing new games or editing existing listings in Creator Studio, wanting to upload high-fidelity cover art and 4 distinct gameplay screenshots directly from their device or via URL.
  - **Storefront Buyers**: Evaluating games in the public catalog and game detail page with an authentic, rich 4-slide gameplay carousel.
- **Not for**:
  - Video or live stream ingestion (video hosting is out of scope; focus is on static high-res artwork & screenshots).

## Hypothesis
We believe providing **a dedicated 1 Cover + 4 Screenshot upload & URL interface with automatic client-side compression** will **empower creators to publish complete, rich game showcases in under 2 minutes** for **NEXORA creators and players**. We'll know we're right when **100% of newly published or edited games persist 1 cover and 4 screenshots in LocalStorage, render accurately in the game detail gallery, and handle large or corrupted file inputs gracefully without crashing storage quotas**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Media Completeness | Exactly 1 Cover + 4 Screenshots | Data model inspection on created/updated game record (`screenshotUrls.length === 4`) |
| LocalStorage Footprint | < 250 KB per compressed image | Storage byte audit via canvas compression |
| Upload Reliability | 100% Graceful Error Recovery | Zero unhandled exceptions on invalid MIME types, oversized files (>10MB), or empty slots |
| Test Coverage | 100% pass across Unit, Integration & Master Suites | Automated test battery validation |

## Scope
**MVP**
- **1 Cover Art Slot**: Primary storefront card / capsule asset with live 16:9 preview, local file upload button/dropzone, and URL fallback.
- **4 Dedicated Screenshot Slots**: 2×2 responsive grid covering the 4-beat showcase formula (Core Gameplay, World/Atmosphere, Systems/UI, Action/Climax), each with a live preview thumbnail, local file upload, and URL fallback.
- **Client-Side Image Compressor**: Automatic canvas resize (max 1280px width, quality 0.85) converting local files to compact base64 strings so LocalStorage never exhausts its 5MB–10MB browser quota.
- **Themed Presets Auto-Fill**: Updating all 4 artwork presets (*Cyberpunk*, *Synthwave*, *Pixel Art*, *Space Strategy*) to populate all 5 slots (1 cover + 4 matching screenshots) with 1 click.
- **Edit Mode Pre-population**: Loading existing `coverImageUrl` and all 4 `screenshotUrls` into the form when editing a game.
- **Smart Slot Fallback**: If optional slots 2–4 are left empty, automatically fallback to screenshot 1 or cover art so the gallery always has 4 valid slides.

**Out of scope**
- Cloud S3 / Cloudinary backend upload (prototype runs 100% standalone and offline in browser LocalStorage).
- Video/trailer uploads (`.mp4`, `.webm`).

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Comprehensive Stress Test Suite (RED) | Failing stress tests covering LocalStorage quota, 10MB files, corrupt MIME types, rapid multi-slot replacement, and fallback invariants | pending | — |
| 2 | Client-Side Image Processor & Compressor | Reusable image reading and canvas compression utility producing lightweight data URLs | pending | — |
| 3 | Form Reactive Model & Presets Expansion | `GameFormComponent` reactive form controls for `screenshot1`..`screenshot4`, updated presets, and edit-mode loading | pending | — |
| 4 | 2×2 Screenshot Grid & Dropzone UI | Grounded Steam DesignMD UI with dropzones, upload buttons, URL toggles, and live previews | pending | — |
| 5 | Quality Gate & Persistence Verification (GREEN) | 100% test pass, verification in catalog and detail gallery, and zero storage exhaustion | pending | — |

## Open Questions
- None. Requirements aligned: 1 Cover + 4 Screenshots, 2×2 responsive grid, dual upload/URL mode, client-side canvas compression, LocalStorage persistence.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Large raw photos (e.g. 5 × 10MB) crashing LocalStorage 5MB quota | High | High | Enforce canvas downscaling to max 1280×720 at 85% WebP/JPEG, clamping each asset under 150KB. |
| Non-image files dropped (e.g. `.exe`, `.pdf`) | Medium | Medium | Validate file MIME type (`image/png`, `image/jpeg`, `image/webp`, `image/gif`) before reading. |
| Rapid sequential file uploads causing state race conditions | Low | Low | Isolate each slot's reading state with slot-specific loading indicators. |

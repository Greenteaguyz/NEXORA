# Steam Design System & Layout Consistency (NEXORA Marketplace)

## Problem
Digital PC gamers and indie creators expect an instantly recognizable, high-density storefront experience (standardized by Steam) with clear affordances for pricing, standalone DRM-free ownership, platform compatibility, and review sentiment. When UI surfaces diverge in layout density, color accents, or typography across catalog, game detail, library, and creator views, users experience cognitive friction and the platform loses the premium feel of an authentic game marketplace.

## Evidence
- **Mental Model Alignment**: The Steam store layout (2-column upper showcase, lime-green action buy CTA, 16:9 capsule art, and tabbed system requirements) represents the dominant 20+ year convention for PC game distribution.
- **Observed Inconsistency**: Prior UI iterations had minor variances in button sizing, badge colors, and container margins across discovery, wishlist, and studio pages.
- **Accessibility Standards**: Need strict WCAG AAA contrast compliance across both Steam Dark Mode (navy/slate `#0E141B`/`#1B2838`) and Steam Light Mode (silver slate `#EBF0F5`/`#FFFFFF`).

## Users
- **Primary**:
  - **Indie PC Gamers**: Browsing, evaluating gameplay media/specs, purchasing, and downloading DRM-free game builds.
  - **Indie Game Creators**: Managing published game listings, pricing, screenshots, and viewing download metrics.
- **Not for**:
  - Mobile micro-transaction stores or non-gaming e-commerce layouts.

## Hypothesis
We believe implementing the **Steam DesignMD specification** (tokens, typography, 2-column showcase, streamlined buy bar, review sentiment indicators, and 16:9 capsule cards) will **eliminate visual dissonance and streamline game discovery and acquisition** for **gamers and creators**. We'll know we're right when **100% of routes strictly share unified design tokens, achieve zero visual layout shifts, and provide an effortless showcase-to-download path**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Design Token Coverage | 100% | Zero hardcoded ad-hoc hex colors in component CSS files |
| Contrast & Accessibility | WCAG AAA (>= 7:1 for normal text, >= 4.5:1 for large/badges) | Automated accessibility & contrast audit |
| Layout Consistency | 100% Route Uniformity | Unified container widths, padding scale (`--space-*`), and border radii |
| Download Flow State Fidelity | 5 distinct button states verified | End-to-end interactive verification of Anonymous -> Login -> Owned -> Download |

## Scope
**MVP**
- **Unified Design Tokens (`src/styles.css`)**: Steam navy void (`#0E141B`), card surface (`#1B2838`), steel highlight (`#2A475E`), electric cyan (`#66C0F4`), action lime green (`#75B022`/`#5C7E10`), star gold (`#E5A93C`), and WCAG AAA light theme palette.
- **Storefront Pavilion & Discovery Grid (`/catalog`)**: Featured showcase pavilion with interactive thumbnail selector, category quick-filter chips, and 16:9 capsule cards with price badges.
- **Game Detail Showcase (`/games/:id`)**: Steam 2-column media player + capsule spec header, streamlined purchase/download banner with OS platform selector (Windows/Linux), checksum trust strip, "About This Game" story block, and tabbed System Requirements.
- **Category Directory (`/genres`)**: Steam-styled category hub with vector iconography and game count indicators.
- **Library & Wishlist Alignment (`/library`, `/wishlist`)**: Consistent collection grids, acquisition status chips, and quick navigation.
- **Creator Studio Dashboard (`/studio`)**: Steamworks-inspired dark telemetry cards and structured game submission/editing forms.

**Out of scope**
- Real-time multiplayer voice/chat network (deferred — focus on standalone DRM-free distribution).
- Third-party external payment processor integration (mock purchase modal and wallet simulation are used).

## Delivery Milestones

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Global Steam Token & Typography Foundation | All global variables in `styles.css` conform to DesignMD Steam tokens (Dark/Light) with responsive header & nav | complete | — |
| 2 | Storefront Pavilion & Capsule Grid | `/catalog` presents featured carousel, quick filters, and 16:9 Steam capsule cards | complete | — |
| 3 | Game Detail Showcase & Streamlined Buy Bar | `/games/:id` features 2-column showcase, media lightbox, platform switcher, and trust strip | complete | — |
| 4 | Genre Directory, Library & Wishlist Polish | Category hub, library shelf, and wishlist layouts adhere to Steam grid and token standards | complete | — |
| 5 | Creator Studio & Full Light/Dark Contrast Audit | Steamworks-style studio dashboard and complete WCAG AAA contrast verification | in-progress | `.claude/plans/steam-design-system.plan.md` |

## Open Questions
- [ ] Should we introduce dynamic discount percentage pills (`-33%`, `-50%`) with original strikethrough prices for promotional showcase items?
- [ ] Should user review distribution (e.g. "Overwhelmingly Positive (98%)") be configurable per game in the mock dataset?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| High density of Steam specs causing clutter on mobile viewports | Medium | Medium | Use responsive flex/grid wrappers, collapsible drawer for navigation, and sticky purchase actions on mobile. |
| Light mode contrast degradation with neon gaming accents | Low | High | Enforce dedicated high-contrast light mode tokens (`#0078D4` blue links, `#558B2F` forest green CTA) mapped in `[data-theme="light"]`. |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

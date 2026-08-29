# Creator Studio: Game Publishing Studio Polish & Bento Media Hub

## Problem
The game publishing workflow (`/studio/games/new` and `/studio/games/:id/edit`) suffers from visual disorganization: the media section stacks 5 disconnected cards with 10 duplicate action buttons that cause jagged card heights when toggling URL inputs; pricing requires manual numeric entry without quick tiers or visual split breakdown; the right sidebar leaves awkward empty vertical space; and the primary publish button is located at the bottom of a 3000px-long page requiring excessive scrolling.

## Evidence
- **Visual Disorganization**: Toggling the URL input on a single screenshot card causes that card to expand, misaligning adjacent grid cells in the same row.
- **Button Redundancy**: 10 distinct upload/URL buttons across 5 cards clutter the visual space.
- **Observed Publishing Friction**: Creators frequently need to scroll back and forth to inspect their changes and find the submit button.
- **Readiness Ambiguity**: Creators lack immediate feedback on which required fields are missing before attempting to submit.

## Users
- **Primary**:
  - **Indie Game Creators**: Creating and editing game listings in Creator Studio, requiring an intuitive, desktop-grade Steamworks publishing workflow.
  - **Storefront Buyers**: Benefiting from properly curated, high-fidelity game metadata and screenshots.
- **Not for**:
  - Non-creator storefront browsing (this is exclusively for Creator Studio publishing).

## Hypothesis
We believe introducing an **Asymmetric Bento Media Hub, 1-click price tier pills, a real-time Publish Readiness Checklist, and a sticky action bar** will **cut publishing completion time and eliminate layout shifts** for **indie game creators**. We'll know we're right when **zero layout shifts occur during media editing, readiness score updates reactively to 100%, and all automated integration and design compliance tests pass**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Media Hub Symmetry | Zero row height mismatch | Height-locked 16:9 aspect ratio across all 5 slots |
| Readiness Completeness | 100% Reactive Sync | Checklist derivation signal tracks title, description, price, tags, and media |
| Sticky Access | 100% Viewport Reach | Fixed sticky footer bar accessible from any scroll position |
| Quality Gate | 100% Pass | Full verify battery pass (Unit + Integration + Master + Anti-Slop) |

## Scope
**MVP**
- **Asymmetric Bento Media Hub**: Cover art hero card on the left + 2×2 screenshot grid on the right, with click-to-upload card bodies and quiet hover overlay controls.
- **Quick Price Tier Pills**: 1-click buttons (`Free`, `$4.99`, `$9.99`, `$14.99`, `$19.99`, `$29.99`) + visual 90/10 revenue progress bar.
- **Live Publish Readiness Checklist**: Dynamic sidebar card showing real-time checkmarks for Title, Description, Pricing, Tags, Cover Art, and 4 Screenshots with completion percentage.
- **Sticky Save & Publish Bar**: Grounded bottom bar with unsaved changes indicator, Cancel button, and prominent Publish/Save button.

**Out of scope**
- Multi-currency forex conversion (USD is standard).
- Cloud S3 direct upload (runs offline in browser LocalStorage).

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Readiness & Tier Computation Tests (RED) | Failing tests covering price tier selection, readiness checklist derivation, and media grid invariants | pending | — |
| 2 | Reactive State & Readiness Signal Engine | Derived signals for readiness items, percentage, and price tier selection | pending | — |
| 3 | Bento Media Hub & Overlay Controls | Balanced rectangular Bento layout with click-to-upload and quiet overlay controls | pending | — |
| 4 | Price Tiers & Visual Revenue Bar | 1-click price pills and 90/10 visual split meter | pending | — |
| 5 | Sticky Action Bar & Sidebar Checklist | Real-time checklist and persistent footer action bar | pending | — |

## Open Questions
- None. Scope confirmed: Bento Grid, Price Tiers, Readiness Checklist, Sticky Action Bar.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sticky footer obscuring page content on short viewports | Low | Medium | Add bottom padding (`padding-bottom: 90px`) to `.game-editor-form` so content is never covered. |
| Bento grid overflowing on small mobile screens | Medium | High | Add `@media (max-width: 900px)` breakpoint to stack Bento layout into single column. |

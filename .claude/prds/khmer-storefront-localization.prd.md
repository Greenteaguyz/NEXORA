# Khmer Storefront Localization

## Problem
Currently, NEXORA only has the header and navigation localized into Khmer. The primary discovery, catalog browsing, and purchase loops present a mixed-language UI (English CTAs with a Khmer header), causing friction and breaking immersion for localized users.

## Evidence
- Assumption — needs validation via telemetry (drop-off rates at checkout for Khmer locale users).
- Observed behavior: Clicking from the localized header into the Catalog or Cart reveals untranslated critical action buttons ("Add to Cart", "Filter", "Checkout").

## Users
- **Primary**: Khmer-speaking gamers who want localized UI navigation and checkout cues while playing international games.
- **Not for**: Game creators/publishers reading analytics (Studio), or users wanting full lore/game description translations (UGC/publisher content).

## Hypothesis
We believe **localizing the storefront UI chrome and critical user actions (Tier 1)** will **provide a seamless purchase and navigation loop** for **Khmer-speaking users**.
We'll know we're right when **the checkout conversion rate for the Khmer locale matches or exceeds the baseline**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Checkout Conversion (KH Locale) | Match EN baseline | Analytics funnel from Catalog to Purchase |
| Localization Toggle Retention | > 80% | Percentage of users who stay on KH after toggling |

## Scope
**MVP** — Localize high-visibility Storefront Chrome & Action CTAs.
Specifically: 
- Catalog filters (Action, RPG, Indie)
- Sorting options
- Search placeholders
- Product CTAs ("Add to Cart", "In Library", "Buy Now")
- Price formatting boundaries
- Cart / checkout modal actions
- Global feedback states (Empty states, loading labels).

**Out of scope**
- Game titles, developer names, publisher names — Steam-style standard; keeps canonical branding.
- Game descriptions, patch notes, user reviews — High volume, low ROI for translation, risk of drift.
- Studio / Creator dashboard — Deferred to Phase 2.

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Global Core & Shared Components | Empty states, loading, generic buttons ("Cancel", "Save") | pending | — |
| 2 | Catalog & Navigation | Translated filters, sort dropdowns, search placeholders | pending | — |
| 3 | Cart & Checkout Loop | Translated "Add to Cart", checkout actions, price labels | pending | — |
| 4 | Game Detail & Library Chrome | Translated headers ("System Requirements", "Developer", "Play") | pending | — |

## Open Questions
- [ ] Should we localize currency symbols (e.g., to KHR ៛) or just keep USD ($) and localize the accompanying text?
- [ ] Are we translating the names of specific genres (e.g., "Metroidvania" vs "RPG"), or keeping niche gaming jargon in English?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Text expansion | High | Medium | Test all buttons with long Khmer strings; ensure flex wrapping or truncation. |
| Mixed language confusion | Medium | Low | Clearly demarcate user-generated content (game titles) from UI chrome. |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

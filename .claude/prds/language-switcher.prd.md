# Language Switcher (EN/KH)

## Problem
A segment of Cambodian gamers faces language barriers because they do not understand English. This prevents them from fully engaging with the NEXORA storefront, hindering local adoption and accessibility.

## Evidence
- Assumption — Needs validation via analytics tracking (e.g., percentage of users adopting the Khmer toggle) or user feedback.
- Strategic business decision to support local Cambodian adoption while remaining an international storefront.

## Users
- **Primary**: Local Cambodian gamers who are not fluent in English and prefer to browse the store in Khmer.
- **Not for**: Users who prefer English or are from regions outside of Cambodia.

## Hypothesis
We believe **an EN/KH language switcher** will **make the store accessible** for **local Cambodian gamers**.
We'll know we're right when **a significant portion of local traffic successfully switches to and utilizes the Khmer locale**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Locale usage | >30% of local traffic | Analytics on language toggle usage |
| Session duration | Increase in session length for KH users | Analytics |

## Scope
**MVP** — 
- A UI language switcher (EN / KH text labels) in the global header following the Impeccable Steam aesthetic.
- Translation of core storefront UI (navigation, buttons, menus).
- **Exceptions**: Certain gaming/technical terminology must remain in English where direct Khmer translation does not make sense.

**Out of scope**
- Support for third languages (e.g., Thai, Chinese).
- Translating user-generated content (e.g., reviews).

## Delivery Milestones
<!-- Business outcomes, not engineering tasks. /plan turns each into a plan. -->
<!-- Status: pending | in-progress | complete -->

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Header Switcher UI | Users can visually see and toggle between EN and KH in the main header. | pending | — |
| 2 | Localization Infrastructure | System can load and apply English and Khmer translation dictionaries dynamically. | pending | — |
| 3 | Core UI Translation | Users see the main storefront navigation and primary CTAs in Khmer (with English loanwords preserved). | pending | — |

## Open Questions
- [ ] Should the site auto-detect the browser language on the first visit to set the default, or always default to English?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Clunky translations | Medium | High | Keep technical/gaming terms in English. Use native speakers to verify translations. |
---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

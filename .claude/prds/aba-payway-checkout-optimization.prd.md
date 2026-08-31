# ABA PayWay Checkout Humanization & Brand Polish

## Problem
Cambodian buyers selecting the ABA PayWay payment method are presented with robotic, developer-oriented monospace copy (`"Scan to pay · amount auto-set"`) and a generic red rectangle placeholder for the ABA logo. This breaks immersion, reduces payment trust, and feels like internal debugging telemetry rather than a polished consumer storefront checkout experience.

## Evidence
- Direct user feedback: `"aba payway is for cambodian user"`, pointing out `"'. amont auto-set'"`, and `"i need a good logo for aba payway"`.
- User screenshot showing `.brand-digits` rendered in monospace font displaying internal implementation details (`amount auto-set`) rather than customer instructions.
- Visual inspection of `PaymentBrandMarkComponent` confirming a primitive red box with basic Arial `<text>` instead of an authentic ABA / PayWay vector mark.

## Users
- **Primary**: Cambodian gamers and international buyers using Cambodian mobile banking apps (ABA Mobile, Bakong, and KHQR-supported banking wallets) to purchase games on NEXORA.
- **Not for**: Credit card-only buyers who bypass the local mobile QR rail.

## Hypothesis
We believe **replacing developer jargon with natural customer guidance and upgrading the ABA brand mark to a high-fidelity vector asset** will **instill trust and clarify the payment experience** for **Cambodian mobile banking users**.
We'll know we're right when **checkout option clarity is verified, copy uses human-readable consumer terminology in standard typography, and all automated regression tests continue to pass 100%**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Consumer Copy Polish | 0 robotic/developer jargon phrases | Automated DOM text verification and visual audit |
| Brand Mark Fidelity | 100% crisp vector SVG with authentic styling | Inspection of `PaymentBrandMarkComponent` rendering |
| Typography Alignment | Standard body font (`var(--font-sans)`) for descriptive text | CSS computed style verification |
| Regression Stability | 100% pass rate across all 851 tests | `npm run verify` quality gate |

## Scope
**MVP**
1. **Human-Centric Copy**:
   - Replace the technical monospace copy `"Scan to pay · amount auto-set"` with natural, consumer-friendly copy: `"Scan with ABA Mobile or any KHQR app"`.
   - Update CSS so descriptive payment method copy uses comfortable, readable typography (`var(--font-sans)`) rather than monospace code font.
2. **Authentic ABA PayWay Vector Logo**:
   - Upgrade the SVG brand mark in `PaymentBrandMarkComponent` with an authentic, desktop-grade vector design reflecting ABA's genuine brand identity (crisp geometric letterforms, signature ABA deep cyan `#005F83` / `#004B6E` or PayWay red badge with refined inner accents and professional kerning).
3. **PayWay Scan Sheet Harmony**:
   - Ensure the customer instructions inside `AbaPaywaySheetComponent` seamlessly match the humanized option label on the parent purchase modal.

**Out of scope**
- Changing the underlying payment processing logic, QR generation, or the 5-minute countdown state machine.
- Re-introducing multi-currency or KHR display conversions into the checkout UI (remains pure USD in checkout per existing design mandate).

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Authentic ABA Brand Mark | High-fidelity vector SVG brand mark with official ABA styling | pending | — |
| 2 | Humanized Customer Copy & Typography | Monospace "amount auto-set" replaced with clean consumer banking guidance in sans-serif | pending | — |
| 3 | Verification & Regression Gate | Zero regressions across test suites (`npm run verify` passes) | pending | — |

## Open Questions
- [ ] Should the brand mark badge feature ABA's signature deep navy/cyan banking tone (`#004F71`) or the PayWay gateway red (`#E31B23`)? *(Recommendation: PayWay Red `#E22326` with authentic white geometric lettering and subtle inner border to match the red KHQR ecosystem tag).*

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Existing stress tests asserting on `"Scan to pay · amount auto-set"` | Low | Medium | Update test assertions to match the approved humanized string. |
| Contrast issues in Light vs Dark theme | Low | Low | Test brand mark container across both `:root` dark theme and `[data-theme="light"]`. |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

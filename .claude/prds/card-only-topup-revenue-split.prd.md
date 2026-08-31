# Card-Only Wallet Top-Up & 90/10 Developer Revenue Split

## Problem
Regular buyers are exposed to creator payout rails (ABA KHQR receiving accounts) inside the wallet top-up dialog, creating friction and confusion around how funds are loaded. Concurrently, game purchases only debit the buyer without automatically allocating sales revenue between the game developer (90%) and the NEXORA platform (10%), leaving creator payout balances disconnected from store sales.

## Evidence
- Observed usability friction in `/account/payment` where receiving bank options appeared in consumer top-up selectors.
- System audit showing game purchase transactions debit buyer wallet/card without issuing corresponding creator royalties or platform fee ledger records.

## Users
- **Primary**:
  - Regular Buyers (e.g. Bob Mercer) loading store wallet funds using credit/debit cards (Visa & Mastercard).
  - Game Creators / Developers (e.g. Alice Vance) publishing games and receiving automated sales revenue distributions.
  - Platform Administration tracking company revenue (10% platform take).
- **Not for**:
  - External banking clearing houses or automated real-world fiat wire transfers (simulated platform ledger only).
  - Non-card consumer top-up methods.

## Hypothesis
We believe restricting wallet top-up strictly to Visa & Mastercard and automating a 90% developer / 10% platform revenue split at purchase time will eliminate buyer confusion and provide instantaneous, auditable earnings distribution for creators. We'll know we're right when 0 non-card options appear in the top-up flow and every game purchase increments the author's payout balance by exactly 90% of the sale price with matching ledger audit records.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Top-up non-card options | 0 | Automated DOM assertion & manual audit of Top-Up modal dropdown |
| Revenue split accuracy | 100% (90% dev / 10% platform) | Unit & integration test verifying integer minor-unit split without float drift |
| Real-time creator crediting | < 100ms on purchase | Creator wallet balance update verification immediately post-checkout |
| Zero broken checkout rails | 100% test pass rate | Existing purchase tests (Wallet, Card, ABA PayWay scan) remain green |

## Scope
**MVP**
- **Card-Only Top-Up Modal**: Restrict the "Top Up Wallet" method selector strictly to saved Visa and Mastercard cards.
- **Automated 90/10 Revenue Split**: When any game purchase completes (via Wallet, Card, or ABA PayWay):
  - 90% of purchase price is credited to the game creator's financial balance (`developer_royalty`).
  - 10% platform fee is recorded into company ledger (`platform_fee`).
  - Ledger creates dual linked entries linking the purchase order ID, game ID, buyer ID, and developer ID.
- **Creator Revenue Dashboard Reflection**: Creator profile / Studio reflects the earned royalty in their available payout balance.
- **Self-Healing Storage Migration**: Purge legacy buyer KHQR records and ensure wallet transactions reflect card funding.

**Out of scope**
- External banking wire clearing / real-world ACH/SWIFT payouts (manual/simulated in MVP).
- Variable or tiered commission rates (fixed 90% developer / 10% platform split for MVP).
- Tax withholding / multi-jurisdictional VAT remittance.

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Card-Only Top-Up & Buyer KHQR Elimination | Top-up modal and payment methods list for regular buyers strictly show Visa/Mastercard; legacy storage cleansed | pending | — |
| 2 | 90/10 Revenue Split Engine | Game purchase triggers atomic 90% developer credit + 10% platform commission ledger allocation | pending | — |
| 3 | Creator Earnings & Payout Reflection | Creator Studio / Payout summary displays real-time gross revenue, platform fee, and net payout balance | pending | — |

## Open Questions
- [ ] Should free games ($0.00) generate $0 ledger split audit entries or be bypassed from the finance ledger? *(Recommendation: Bypass ledger for $0 orders, record in order history only).*

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Floating point rounding error in 90/10 split | Low | High | Use existing `Money` Minor Units (cents) with integer arithmetic (`Math.floor` / `Math.round`) so cents always sum to 100% of game price |
| Orphaned games without identified creator | Low | Medium | Default creator ID to game author/studio or platform treasury if creator is unspecified |
| Stale browser cache reintroducing legacy top-up options | Medium | Medium | Implement Tier 1 self-healing migration in `MockPaymentsDataService.initData()` |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

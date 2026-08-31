# Creator-Exclusive Bakong KHQR Payout & Clean Buyer Payment Experience

## Problem
Regular buyers on NEXORA see an "Active Bakong KHQR Link" preview container displaying a personal receiving QR code and bank handles on `/account/payment`, alongside options to link receiving bank accounts. In real-world commerce, buyers scan merchant QR codes at checkout to spend money rather than broadcasting personal receiving QRs in customer settings; presenting receiving payout rails to consumer accounts creates role confusion, visual clutter, and misleads buyers about the platform's payment architecture.

## Evidence
- Observed UI behavior in `/account/payment` where buyer Bob Mercer (`usr_bob`) sees a merchant-style "Active Bakong KHQR Link" showcase card and "Bakong Link" tab in the payment method modal despite being a consumer player.
- Direct feedback from user: *"aba payway is exclusive for the owner / developer not user ... regular buyers ... option C ... confusion"*.

## Users
- **Primary**: Regular buyers (consumer players like Bob Mercer) managing payment instruments and wallet funds on `/account/payment`.
- **Secondary**: Game creators / developers (like Alice Vance) who publish titles and receive sales revenue payouts.
- **Not for**: External third-party payment gateways or anonymous visitors.

## Hypothesis
We believe **restricting Bakong KHQR receiving links and showcase previews exclusively to creator/developer roles** will **eliminate user confusion and deliver a clean consumer payment interface** for **regular buyers**.
We'll know we're right when **regular buyers on `/account/payment` see only customer payment methods (Cards & Wallet), the "Bakong Link" tab is omitted from the buyer add-method dialog, Bob Mercer's seed data contains no receiving bank handles, and checkout ABA PayWay scanning remains 100% functional for all buyers**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Buyer Page Cleanliness | 0 receiving QR cards rendered for non-creator accounts | Automated component integration test & visual audit |
| Add Method Form Simplicity | 1 tab (Credit/Debit Card) for non-creators | Component DOM assertions for `isCreator() === false` |
| Creator Payout Retention | 100% of creators retain Bakong payout linking | Verification tests for creator user role |
| Checkout Continuity | 100% passing ABA PayWay checkout tests | Playwright & integration test suites |

## Scope
**MVP** — 
- Hide the "Active Bakong KHQR Link" showcase container on `/account/payment` for non-creator users.
- In `AddPaymentMethodFormComponent`, only display the "Bakong Link" tab when the authenticated user has the `creator` role; render a direct card form for standard buyers.
- Reassign `pm_bob_khqr` in seed data from buyer Bob Mercer (`usr_bob`) to creator Alice Vance (`usr_alice`) or creator-only records so Bob Mercer's payment page lists only consumer instruments (Visa card & wallet).
- Keep ABA PayWay QR scanning in `PurchaseConfirmModalComponent` intact for all buyers purchasing games.

**Out of scope**
- Removing ABA PayWay QR payment rail from checkout (buyers still use PayWay to pay).
- Altering the finance ledger minor unit math, idempotency, or double-entry accounting.
- Building a full banking payout reconciliation backend.

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Gate KHQR Showcase & Form Tabs | Regular buyers on `/account/payment` see only cards/wallet without receiving QR preview or Bakong link tab | pending | — |
| 2 | Reassign Seed Data to Creator Persona | Bob Mercer has clean consumer profile; Alice Vance holds creator payout account | pending | — |
| 3 | Verification & Quality Gate | All integration, unit, and master test suites pass with zero regressions | pending | — |

## Open Questions
- [ ] Should Creator Studio gain a dedicated "Payout Settings" card in its metrics grid or remain within `/account/payment` under creator role detection?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Regression in existing tests asserting on Bob's KHQR method | High | Medium | Update test assertions in `unit-tests.spec.ts` and `integration-tests.spec.ts` to expect KHQR linked to Alice (creator) rather than Bob (buyer). |
| Accidental removal of checkout ABA PayWay rail | Low | High | Keep `PurchaseConfirmModalComponent` ABA PayWay button and sheet completely decoupled from creator payout settings. |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

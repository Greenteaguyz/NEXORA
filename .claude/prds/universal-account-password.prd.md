# Universal Account Password & Robust Failure Gate

## Problem
Currently, NEXORA supports a confusing hybrid state where accounts can be "passwordless" (seeded personas and mock accounts without credentials) or "password-protected." This forces awkward, defensive UI copy ("No password set — sign in via email" vs "Password active"), bifurcates the Change Password modal (conditionally hiding Current Password), and fails to model realistic desktop gaming platforms (Steam, Epic, PlayStation) where every account has a secured password by default.

## Evidence
- Profile card required defensive conditional text switching ("Password active" vs "No password set — sign in via email").
- Change Password modal had to conditionally render the "Current Password" input depending on whether a credential record existed in storage.
- User feedback confirmed: "both logic password and passwordless isn't good just from my perspective."

## Users
- **Primary**: All authenticated NEXORA members (gamers, creators, and seed demo personas Alice & Bob).
- **Not for**: External third-party OAuth providers that do not touch the local credential boundary.

## Hypothesis
We believe **unifying all accounts to require a password by default (with seed personas pre-provisioned with `Password123!`)** will **eliminate bifurcated modal logic, remove awkward status copy, and enforce universal authentication integrity** for **all users**.
We'll know we're right when **100% of accounts have credentials, the Profile card displays a single permanent "Change Password" action, and all 10 failure cases pass in stress testing without regressions**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Universal Password Coverage | 100% | Every user in `SEED_USERS` and new registrants has a credential record |
| Modal Branching Complexity | 0 branches | Always 3 fields (Current $\rightarrow$ New $\rightarrow$ Confirm) |
| Failure Stress Gate | 100% pass rate | 10 targeted failure case tests passing in `change-password-stress.ts` |
| Full Repository Quality Gate | 100% green | Zero build errors, 0 unit/integration failures on `npm run verify` |

## Scope
**MVP**
1. Seed credentials provisioned for all default users (`SEED_USERS`) with standard demo password `Password123!`.
2. Strict password authentication: `authenticate()` requires password verification on all accounts.
3. Developer demo switching (`switchDemoUser`) seamlessly supplies default demo credentials.
4. Profile page card permanently labeled `Account Password` with clean description `Used to sign in to your NEXORA account` and permanent `[Change Password]` action button.
5. Modal always renders Current Password, New Password, and Confirm Password with same-password rejection and 5-attempt rate-limiting lockout.
6. Comprehensive failure stress suite (10 isolated failure scenarios).

**Out of scope**
- SMS / Email OTP 2FA (deferred to future Steam Guard milestone).
- Passkey / WebAuthn hardware keys.
- Biometric authentication.

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Seed & Auth Credential Hardening | Seed credentials provisioned; strict authentication required on all logins | in-progress | `.claude/PRPs/plans/universal-account-password.plan.md` |
| 2 | Profile UI & Modal Unification | Card and modal permanently require Current Password; copy unified | in-progress | `.claude/PRPs/plans/universal-account-password.plan.md` |
| 3 | Failure Stress Battery & Quality Gate | 10 failure stress cases passing; `npm run verify` 100% green | in-progress | `.claude/PRPs/plans/universal-account-password.plan.md` |

## Open Questions
- [x] Should seed personas have a standard demo password? **Yes: `Password123!`**.
- [x] Should header quick-switcher still work smoothly? **Yes: `switchDemoUser` passes `Password123!` automatically**.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Existing tests expecting passwordless login fail | Medium | High | Update test fixtures to pass `Password123!` on `authenticate()` |
| Users attempt to change password to identical password | Medium | Low | Add client-side and server-side validation rejecting identical new password |
| Brute force credential attacks | High | Medium | Enforce 5-attempt rate-limit with 60-second lockout and countdown display |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*

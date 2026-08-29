# Creator Studio Lifecycle Suite: Recycle Bin, Drafts, Revenue Metrics & Undo Protection

## Problem
Currently, Creator Studio lacks a realistic publishing lifecycle: unfinished games cannot be saved as private drafts without failing full validation or exposing them to the public storefront; deleted/unpublished games permanently clutter the main active workspace because there is no separate Recycle Bin or permanent purge mechanism; creators risk permanent data loss from accidental clicks without an instant Undo safety net; and creators lack visibility into their net sales revenue on their dashboard.

## Evidence
- **Accidental Deletion Risk**: Creators have no quick Undo button if they miss-click a delete action.
- **Table Clutter**: Unpublished games are permanently rendered inline with active games, diluting daily workspace focus.
- **Inability to Clean Storage**: Test games and discarded drafts cannot be permanently purged from browser LocalStorage.
- **Revenue Blindspot**: Creators cannot see their actual 90% net payout revenue from customer orders on their Studio dashboard.

## Users
- **Primary**:
  - **Indie Game Creators**: Managing game listings, drafting unreleased games, and tracking net earnings in Creator Studio.
- **Not for**:
  - Storefront buyers (public buyers only interact with published, active games in `/catalog`).

## Hypothesis
We believe providing an **integrated 4-card metric grid (including 90% Net Total Revenue), a dedicated Recycle Bin tab with permanent purge, private Drafts, and an 8-second instant Undo toast** will **eliminate accidental data loss and declutter creator workspaces** for **indie game creators**. We'll know we're right when **all 18 stress failure cases pass with 100% green tests, zero draft leaks occur in the public catalog, and rapid delete-undo stress cycles maintain exact state invariants**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Catalog Isolation | 0 leaks | Public `getGames()` and search never return draft or soft-deleted games |
| Miss-Click Resilience | 100% Recoverable | Undo function restores deleted drafts within grace window |
| Permanent Purge Integrity | 0 dangling records | Permanent delete and empty bin fully wipe items from LocalStorage |
| Stress Suite Pass Rate | 100% Pass | 18 stress test assertions covering edge cases, concurrency, and multi-tenant isolation |

## Scope
**MVP**
- **4-Card Metrics Grid**: Active Games (Green), Drafts (Amber), Total Catalog Value (Cyan), Total Revenue (Emerald 90% Net).
- **Recycle Bin Tab**: Tab strip above the table (`All`, `Active`, `Drafts`, `Recycle Bin`) isolating soft-deleted items from production listings.
- **Two-Stage Deletion**: Stage 1 soft-delete to Recycle Bin with confirmation modal; Stage 2 permanent deletion with warning modal & batch empty bin.
- **Miss-Click Prevention & Undo**: 8-second quick Undo toast notification with duplicate click protection.
- **Catalog Isolation**: Drafts and bin items are strictly hidden from public store and search.

**Out of scope**
- Automated recurring scheduled publishing (cron).
- Multi-currency banking payouts (all transactions run in USD).

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Lifecycle Stress Test Suite (RED) | 18 comprehensive failure/edge-case tests written in `integration-tests.spec.ts` | pending | .claude/plans/creator-studio-lifecycle-suite.plan.md |
| 2 | Data Layer & Permanent Purge Engine | `permanentlyDeleteGame` and `emptyRecycleBin` implemented in `MockGamesDataService` | pending | .claude/plans/creator-studio-lifecycle-suite.plan.md |
| 3 | Total Revenue Calculation Engine | Real-time 90% net sales calculation from confirmed customer orders | pending | .claude/plans/creator-studio-lifecycle-suite.plan.md |
| 4 | Studio Tabbed Workspace & Recycle Bin | View filter tabs (`All`, `Active`, `Drafts`, `Recycle Bin`) and archival table view | pending | .claude/plans/creator-studio-lifecycle-suite.plan.md |
| 5 | Reminder Modals & Undo Toast System | Pre-delete modal, permanent purge modal, and 8-second `[Undo]` toast | pending | .claude/plans/creator-studio-lifecycle-suite.plan.md |

## Open Questions
- None. Requirements and failure cases confirmed.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Empty Recycle Bin deleting other creators' games | Low | Critical | Strict `g.ownerId === ownerId` filtering enforced in unit tests. |
| Rapid delete-and-undo creating duplicate entries | Medium | High | Idempotent insertion and ID deduplication checks. |
| LocalStorage quota exhaustion from test games | Low | Medium | Permanent deletion and batch empty bin free up LocalStorage capacity. |

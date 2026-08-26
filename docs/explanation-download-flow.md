# Architecture of the gated download flow

This document details the state machine, decision logic, and architectural rationale behind the gated download flow in NEXORA.

For step-by-step implementation instructions, see [Tutorial: Implementing the Gated Download Flow](./tutorial-download-flow.md).

---

## Architectural requirements

The download flow satisfies four core requirements:
1. **Universal authentication**: All downloads require an authenticated user session.
2. **Dynamic acquisition path**: Free titles require instant library tracking; paid titles require purchase confirmation.
3. **Session persistence**: Unauthenticated users must return to their intended download flow after logging in.
4. **Soft-deletion resilience**: Titles soft-deleted by creators must disable downloads while preserving library records for previous owners.

---

## Download state machine

The download component manages five distinct operational states:

| State | Condition | Display Label | Action on Click |
| :--- | :--- | :--- | :--- |
| **Anonymous** | Unauthenticated user | **Download** | Redirects to `/login?returnUrl=...` |
| **Free, Unowned** | `currentUser` + `price === 0` + unowned | **Download Free** | Adds title to library and initiates download |
| **Paid, Unowned** | `currentUser` + `price > 0` + unowned | **Buy $X.XX** | Opens confirmation modal before acquisition |
| **Owned** | `isOwned === true` | **Download** | Initiates file delivery immediately |
| **Soft-deleted** | `deletedAt !== undefined` | **Unavailable** | Disabled (no action) |

---

## Decision tree and sequence flow

The following diagram illustrates how authentication, ownership, and pricing checks branch during the download process:

```mermaid
flowchart TD
    START(["👤 User Clicks Download Button on /games/:id"]) --> CHECK_AUTH{"Is User<br/>Logged In?"}

    %% ANONYMOUS BRANCH
    CHECK_AUTH -->|No: Anonymous| REDIRECT["🔄 Redirect to /login<br/>(Preserve returnUrl)"]
    REDIRECT --> LOGIN_SUCCESS["🔑 User Authenticates<br/>(Bounces back to Game Detail)"]
    LOGIN_SUCCESS --> CHECK_OWNED

    %% AUTHENTICATED BRANCH
    CHECK_AUTH -->|Yes: Logged In| CHECK_OWNED{"Does User<br/>Own the Game?"}

    %% ALREADY OWNED
    CHECK_OWNED -->|Yes: Already in Library| DL_DIRECT["⚡ Instant File Download<br/>(Browser downloads .zip)"]

    %% NOT OWNED BRANCH
    CHECK_OWNED -->|No: Not Owned| CHECK_PRICE{"Is the Game<br/>Free or Paid?"}

    %% FREE ACQUISITION
    CHECK_PRICE -->|Free: $0.00| ADD_LIB_FREE["📦 Add to Library<br/>(LibraryService.addToLibrary)"]
    ADD_LIB_FREE --> UPDATE_SIGNAL_FREE["✨ isOwned Signal = true<br/>(Button updates to 'Download')"]
    UPDATE_SIGNAL_FREE --> DL_DIRECT

    %% PAID PURCHASE FLOW
    CHECK_PRICE -->|Paid: > $0.00| MODAL["💳 Open Purchase Modal<br/>(Review Title & Price)"]
    MODAL --> USER_CONFIRM{"User Confirms<br/>Purchase?"}
    USER_CONFIRM -->|Cancel| CLOSE_MODAL["❌ Modal Closed<br/>(No changes made)"]
    USER_CONFIRM -->|Confirm| CREATE_ORDER["🧾 Create Order Receipt<br/>(OrdersService.createOrder)"]
    CREATE_ORDER --> ADD_LIB_PAID["📦 Add to Library<br/>(LibraryService.addToLibrary)"]
    ADD_LIB_PAID --> UPDATE_SIGNAL_PAID["✨ isOwned Signal = true<br/>(Modal closes & Button flips to 'Download')"]
    UPDATE_SIGNAL_PAID --> AUTO_DL["🚀 Automatic File Download<br/>(Browser downloads .zip immediately)"]

    %% VISUAL STYLING
    classDef action fill:#EFF6FF,stroke:#2563EB,stroke-width:2px,color:#1E40AF;
    classDef decision fill:#FEF3C7,stroke:#D97706,stroke-width:2px,color:#92400E;
    classDef success fill:#ECFDF5,stroke:#059669,stroke-width:2px,color:#065F46;
    classDef cancel fill:#FEE2E2,stroke:#DC2626,stroke-width:2px,color:#991B1B;

    class START,REDIRECT,LOGIN_SUCCESS,MODAL,CREATE_ORDER,ADD_LIB_FREE,ADD_LIB_PAID action;
    class CHECK_AUTH,CHECK_OWNED,CHECK_PRICE,USER_CONFIRM decision;
    class DL_DIRECT,AUTO_DL,UPDATE_SIGNAL_FREE,UPDATE_SIGNAL_PAID success;
    class CLOSE_MODAL cancel;
```

---

## Global Steam Download Tray Architecture

Whenever a download begins, the [`DownloadService`](file:///c:/Users/User/Downloads/AngularProject/src/app/core/services/download.service.ts) registers an active download package into its reactive signals store:

1. **Signals State**:
   * `activeDownloads`: Signal list containing active items, progress percentages (`0% -> 100%`), transfer speeds (`52.1 MB/s`), file size counters, and completion statuses.
   * `isTrayOpen`: Signal controlling the visibility of the docked bottom tray.
   * `isTrayExpanded`: Signal controlling the expansion of the itemized downloads panel.
2. **Realistic Progress Emulation**:
   * Simulates realistic network transfer with incremental chunk increments (`0% -> 38% -> 76% -> 100%`) over ~2.4 seconds.
   * Updates state to `completed` upon reaching 100% and displays a direct `[ Play ]` launch action.
3. **Global Docked Shell Component**:
   * `<app-download-tray></app-download-tray>` lives in `app.component.ts` at the root application shell, allowing background downloads to persist uninterrupted as users browse catalog, studio, or profile views.

---

## Architectural trade-offs

Requiring user registration prior to downloading free titles introduces minor friction for first-time visitors. However, this design ensures that all library acquisitions, download telemetry, and user ownership records flow through a single verified pipeline.

---

## Related documentation

* [Tutorial: Implementing the Gated Download Flow](./tutorial-download-flow.md)
* [Routes & Guards Reference](./reference-routes-guards.md)
* [Data Models Reference](./reference-data-models.md)

# Explanation: Download Flow

This document explains the logic behind the game download flow. For step-by-step guidance on implementing the UI, see the [Download Flow Tutorial](tutorial-download-flow.md).

## The Problem

We need to gate game downloads. Free games require ownership tracking. Paid games require purchase confirmation. All games require authentication. The flow must gracefully handle deleted games that users already own.

## The Design

We chose a strict, single-branch path for the download action. Every download requires authentication. There is no special "guest download" path for free games. 

Ownership is tracked via a `LibraryEntry` record, not a boolean field on the `Game` itself. This decouples the catalog from user state.

### Download Button States

The download button manages five distinct states:

1. **Anonymous:** User is not logged in. Clicking prompts a redirect to the login page.
2. **Free + Unowned:** Game is free. Clicking adds a `LibraryEntry` and starts the download.
3. **Paid + Unowned:** Game costs money. Clicking opens the purchase confirmation modal.
4. **Owned:** User has a `LibraryEntry` for the game. Clicking downloads the file immediately.
5. **Deleted:** Game was soft-deleted by the creator. If the user owns it, the button shows "Unavailable" and is disabled.

### The Free vs. Paid Branch

The flow diverges at the initial click for unowned games:
- Free games immediately create a library entry.
- Paid games open a modal (Title, Price, Confirm/Cancel). No fake payment fields are required.

The flow converges after the specific action completes. Both branches end by creating a `LibraryEntry` and transitioning the button to the "Owned" state.

## Trade-off

Requiring an account to download free games adds friction for users. However, it simplifies the architecture by forcing all downloads through the same auth-gated pipeline. This exercises more code paths (registration, library tracking) and keeps the data model consistent.

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

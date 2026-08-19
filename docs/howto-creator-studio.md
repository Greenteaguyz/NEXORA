# How to implement the Creator Studio

This guide explains how to build the Creator Studio dashboard where creators manage, publish, edit, and soft-delete game listings in NEXORA.

For route definitions and authorization guards, see the [Routes & Guards Reference](./reference-routes-guards.md).

---

## Procedure

### 1. Create the studio list view

Build `StudioListComponent` using a data table (`<table>`) to list games owned by the logged-in creator. Include the following columns:
* **Title**: Game title linking to its detail preview.
* **Price**: Unit price formatted in currency.
* **Date created**: Publication timestamp.
* **Actions**: **Edit** and **Delete** buttons.

### 2. Create the reusable game form component

Build a standalone `GameFormComponent` using Angular reactive forms:
1. Include form controls for `title`, `description`, `price`, `coverImageUrl`, `samplePackageUrl`, and `screenshotUrls`.
2. Integrate `TagChipInputComponent` for interactive tag management (type a label and press **Enter** to add).
3. Apply validation rules (`Validators.required`, `Validators.min(0)` for price).

### 3. Reuse the form for creation and updates

Embed `GameFormComponent` in both `StudioCreateComponent` and `StudioEditComponent`. Pass existing game data via `@Input()` when editing, or initialize empty controls when creating.

### 4. Wire the soft-delete operation

In `StudioListComponent`, bind the **Delete** button to open a confirmation dialog. When confirmed, call `GamesDataService.deleteGame(id)` to perform a soft-delete:
* Sets `deletedAt = new Date().toISOString()`.
* Does not purge the database record, ensuring existing library owners maintain purchase records.

### 5. Protect edit routes with ownershipGuard

Apply `ownershipGuard` to `/studio/games/:id/edit`. This functional guard checks whether the authenticated user's ID matches the game's `ownerId`, preventing unauthorized URL tampering.

---

## Verification

1. Sign in using a creator account (`creator@nexora.io`).
2. Navigate to [`http://localhost:4200/studio`](http://localhost:4200/studio).
3. Click **Add New Game**, fill in the form fields, and submit.
4. Verify that the game appears in both the Creator Studio table and the public catalog.
5. Click **Edit**, modify the price or title, and verify that changes persist.
6. Click **Delete** and confirm the dialog.
7. Verify that the game is excluded from the public catalog and marked as **Unavailable** in libraries.

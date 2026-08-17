# How to build the creator studio

This guide details how to build the dashboard where creators manage their games. See the [Routes and Guards Reference](reference-routes-guards.md) for how access to these routes is controlled.

## Steps

### 1. Create the Studio List Page

Build the `StudioListComponent`. Use an HTML `<table>` to display the creator's games. Include columns for:
- Title
- Price
- Date created
- Actions (Edit and Delete buttons)

### 2. Create the Game Form Component

Build a standalone `GameFormComponent` using Angular reactive forms.
- Include inputs for title, description, price, and image URLs.
- Build a custom chip input for tags (type a word, press Enter to add).
- Add validation rules (e.g., title is required, price must be positive).

### 3. Reuse the Form for Create and Edit

Use the `GameFormComponent` in both `StudioCreateComponent` and `StudioEditComponent`. Pass initial data to the form via an `@Input()` when editing.

### 4. Wire the Delete Action

In the studio list, bind the Delete button to a method that calls `window.confirm()`. If the user confirms, call the `GamesDataService` to perform a soft delete. Set the `deletedAt` field on the game object instead of removing the record completely.

### 5. Add the ownershipGuard

Protect the edit route (`/studio/games/:id/edit`) with the `ownershipGuard`. This ensures a creator cannot manually type an ID in the URL to edit another creator's game. This is the only creator route that needs `ownershipGuard` — see the [Routes and Guards Reference](reference-routes-guards.md#route-table) for the full guard list per route, and why `/studio/games/new` is excluded.

## Verification

1. Log in as a creator.
2. Navigate to the studio and create a new game.
3. Verify the game appears in the studio list and the public catalog.
4. Edit the game and save. Verify the changes reflect in the list.
5. Delete the game. Verify it no longer appears in the catalog, and any user who previously added it to their library now sees it marked as 'Unavailable'.

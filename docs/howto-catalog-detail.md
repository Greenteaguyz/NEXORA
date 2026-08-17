# How to build the catalog and game detail pages

This guide covers building the public-facing catalog and the individual game detail pages. Review the [API Services Reference](reference-api-services.md) to see how components fetch this data.

## Steps

### 1. Create the Game Card Component

Build a standalone `game-card` component. It should display the cover image, title, and price. Add a click handler or `routerLink` to navigate to the detail page.

### 2. Build the Catalog Grid

Create the `CatalogComponent`. Use CSS Grid to display the game cards.

```css
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}
```

### 3. Add Tag Filters

Build a horizontal chip list for tag filtering.
- Extract a dynamic vocabulary of tags by iterating over the games list.
- Make the chips single-select.
- Apply the NEXORA electric violet accent color (`--accent-600`) to the active chip.

### 4. Add the Search Input

Add a text input above the grid. Filter the displayed games based on title matches. Debounce the input to avoid excessive updates.

### 5. Create the Game Detail Page

Build the `GameDetailComponent`.
- Use a two-column layout on desktop (hero cover on the left, info and actions on the right).
- Stack the columns on mobile breakpoints (<768px).
- Add a row of screenshots below the main hero section.

### 6. Resolve the Creator Display Name

The game object only stores the `ownerId`. Inject the `USERS_DATA` service in the detail component to fetch the creator's full profile and display their name.

## Verification

1. Open the catalog page.
2. Verify the CSS grid reflows correctly when you resize the browser below 768px.
3. Click a tag chip. Verify the list filters and the chip changes color.
4. Click a game card to view the detail page.
5. Verify the creator's display name resolves correctly.

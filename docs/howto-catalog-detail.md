# How to build catalog and game detail views

This guide explains how to build the public game catalog and detailed game view pages in NEXORA.

For service definitions and data access methods, see the [API & Data Services Reference](./reference-api-services.md).

---

## Procedure

### 1. Create the game card component

Build a standalone `GameCardComponent` to render individual game previews in catalog grids:
* Display the cover image, title, price badge, and genre tag.
* Bind a `routerLink` navigating to `/game/:id`.

### 2. Build the catalog grid layout

Create `CatalogComponent` and define a responsive CSS Grid:

```css
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}
```

### 3. Add dynamic tag filtering

Implement a horizontal chip filter bar:
1. Derive unique tags dynamically from the active game collection.
2. Maintain active tag state with an Angular signal.
3. Highlight selected chips using the `--accent-600` theme token.

### 4. Implement reactive search

Add a search text input above the grid. Filter games by matching query substrings against game titles and descriptions:

```typescript
filteredGames = computed(() => {
  const query = this.searchQuery().toLowerCase().trim();
  const selectedTag = this.activeTag();

  return this.games().filter(game => {
    const matchesTag = !selectedTag || game.tags.includes(selectedTag);
    const matchesQuery = !query || game.title.toLowerCase().includes(query);
    return matchesTag && matchesQuery;
  });
});
```

### 5. Create the game detail layout (Steam & itch.io Hybrid Pattern)

Build `GameDetailComponent` with clean, distraction-free sections:
* **Hero Title & Breadcrumbs**: Minimalist title bar with navigation hierarchy.
* **Upper Showcase Stage (65% / 35% split)**:
  * Left: 16:9 interactive media player with screenshot gallery.
  * Right: Quick-spec capsule (overall reviews, release date, developer link, package size, and distribution model).
* **Purchase & Download Banner (itch.io style)**:
  * 1-click platform switcher (`Windows 64-bit`, `Linux x86_64`, `Steam Deck`).
  * Unit price tag, direct buy/download CTA, and wishlist toggle.
  * Package download size, 100% DRM-Free guarantee badge, and 1-click SHA-256 checksum copy.
* **Lower Content & Sidebar Grid (70% / 30% split)**:
  * Left: Concise narrative premise + 4 clean **Key Features** cards with vector icons.
  * Left: Dual-tier **System Requirements** table (Windows & Linux tabs, Minimum vs. Recommended).
  * Left: **Community Reviews** with positive rating percentage and verified player quotes.
  * Right Sidebar: **Developer Spotlight** panel (avatar, `Verified Creator` badge, bio, and profile link) + **Game Features** checklist.

### 6. Resolve the creator display name and profile

Because the `Game` interface stores only `ownerId`, inject `USERS_DATA` to resolve creator profile metadata and bind the Developer Spotlight:

```typescript
export class GameDetailComponent {
  private usersData = inject(USERS_DATA);
  
  creator = computed(() => {
    const g = this.game();
    if (!g) return null;
    return this.usersData.getUser(g.ownerId) || null;
  });
}
```

---

## Verification

1. Navigate to [`http://localhost:4200/catalog`](http://localhost:4200/catalog).
2. Resize the browser viewport below `768px` and verify that the grid reflows cleanly without horizontal scroll.
3. Click a genre tag chip and verify that the game list filters immediately.
4. Click a game card to navigate to its detail page.
5. Verify that the hero showcase, purchase banner, key features grid, developer spotlight, and dual-tier hardware specs render with zero layout shifts or text bloat.

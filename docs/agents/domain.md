# Domain Model & Glossary: NEXORA

This file defines the canonical domain vocabulary, entity concepts, and business invariants for **NEXORA** (Next-Gen Indie & Game Platform). All AI agents, skills, and code modifications MUST adhere to these definitions.

---

## 1. Core Domain Entities

### Game
- **Definition**: A playable video game or interactive experience published on NEXORA.
- **Attributes**: `id`, `slug`, `title`, `tagline`, `description`, `price`, `discountPercentage`, `rating`, `ratingCount`, `creatorId`, `genres`, `tags`, `thumbnailUrl`, `screenshots`, `downloadUrl`, `fileSizeBytes`, `minimumRequirements`, `recommendedRequirements`, `releaseDate`, `updateDate`, `isFeatured`, `isTrending`.
- **Invariants**:
  - `price` must be $\ge 0$.
  - Free games have `price === 0` and can be downloaded immediately by authenticated or guest users (depending on access tier).
  - Discounted prices are computed via `price * (1 - discountPercentage / 100)`.

### Creator / Studio
- **Definition**: An entity (individual developer or team) that publishes games on NEXORA.
- **Attributes**: `id`, `slug`, `displayName`, `bio`, `avatarUrl`, `bannerUrl`, `socialLinks`, `gamesCount`, `totalDownloads`, `followersCount`, `isVerified`, `joinedDate`.
- **Invariants**:
  - Every game belongs to exactly one `creatorId`.
  - Creator profiles show aggregated metrics (games count, total downloads, followers).

### User / Player
- **Definition**: An account holder browsing, purchasing, reviewing, or downloading games.
- **Attributes**: `id`, `username`, `email`, `avatarUrl`, `library` (game IDs owned), `wishlist` (game IDs bookmarked), `role` (`'player' | 'creator' | 'admin'`).

### Review & Rating
- **Definition**: User feedback and numerical score (1-5 stars) submitted for a specific game.
- **Invariants**:
  - Rating is an integer between 1 and 5.
  - Overall game rating is the arithmetic mean of all approved reviews.

### Download Flow & Bundle
- **Definition**: The secure process and manifest for acquiring game binaries.
- **Lifecycle**: Initiated $\rightarrow$ Token Verification $\rightarrow$ Stream / Direct Download $\rightarrow$ Completed $\rightarrow$ Logged to Library.

---

## 2. Domain Glossary

| Term | Meaning |
| :--- | :--- |
| **Catalog** | The global collection of published, searchable games. |
| **Featured Game** | Highlighted hero game pinned to the home / discovery carousel. |
| **Tracer Bullet** | A minimal end-to-end slice of functionality connecting UI, service, and state to validate architecture early. |
| **Direct Route vs Modal** | Game details can be viewed full-page or via quick-preview overlays. |
| **Offline Fallback** | Fallback mock / cached dataset used when the backend or external API is unavailable. |

---

## 3. Key Invariants & Architectural Rules

1. **Angular Standalone Components**: NEXORA uses modern Angular standalone components and signals/RxJS observables for reactive state.
2. **Deterministic Mock Data**: Development and test modes must function completely offline with high-fidelity mock datasets.
3. **WCAG AA Compliance**: High-contrast dark themes must maintain a minimum 4.5:1 contrast ratio for text and meet accessibility standards.
4. **Non-destructive State**: State modifications (library adds, wishlist toggles, reviews) must preserve immutability.

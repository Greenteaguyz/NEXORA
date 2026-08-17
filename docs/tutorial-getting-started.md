# Tutorial: Getting Started with NEXORA

Welcome to **NEXORA**! This tutorial walks you through setting up the project from zero to a running application. 

## Prerequisites

Before you begin, ensure you have the following installed:
* Node.js (v18 or later)
* Angular CLI (v17 or later)

Verify your installation:
```bash
node -v
ng version
```

## Step 1: Create the Angular Project

We use Angular's standalone components for this project. Create the new project using the Angular CLI:

```bash
ng new nexora --standalone
cd nexora
```

## Step 2: Start the Development Server

Let's verify everything works. Start the Angular development server:

```bash
ng serve
```

Open your browser and navigate to `http://localhost:4200`. You will see the default Angular welcome page. 

## Step 3: Set Up the Folder Structure

Stop the development server (`Ctrl+C`). We structure our application by feature. Create the core folders:

```bash
mkdir src/app/core
mkdir src/app/shared
mkdir src/app/features
mkdir src/app/layout
```

## Step 4: Create Design Tokens

We use plain CSS with design tokens tailored to the **NEXORA** modern cyberpunk/indie game distribution theme. Open `src/styles.css` and define the custom properties:

These are the same tokens used throughout the rest of the app — see the full [Design Tokens Reference](./site_architecture.md#design-tokens-reference) for the complete void/neon/spacing scale.

```css
:root {
  /* Brand Primary — Electric Violet */
  --accent-400:    #A78BFA;
  --accent-500:    #8B5CF6;
  --accent-600:    #7C3AED;
  --accent-700:    #6D28D9;

  /* Cyber Accents */
  --cyan-400:      #22D3EE;
  --cyan-500:      #06B6D4;
  --emerald-400:   #34D399;
  --emerald-500:   #10B981;
  --rose-500:      #F43F5E;

  /* Surfaces & Backgrounds */
  --bg-void:       #0B0D13;
  --bg-surface:    #131622;
  --bg-elevated:   #1A1E2E;
  --bg-input:      #0E111B;

  /* Semantic Text Colors */
  --text-primary:   #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted:     #64748B;

  /* Borders & Glow Effects */
  --border-card:    #1E2438;
  --border-subtle:  rgba(139, 92, 246, 0.15);
  --border-glow:    rgba(139, 92, 246, 0.4);
  --shadow-glow:    0 0 20px rgba(124, 58, 237, 0.25);

  /* Spacing Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Border Radii */
  --radius-sm: 4px;
  --radius:    8px;
  --radius-lg: 12px;

  /* Typography */
  --font-sans: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background-color: var(--bg-void);
  color: var(--text-primary);
}
```

## Step 5: Create the First Data Model

Let's define what a game looks like in our marketplace. Create a new file `src/app/core/models/game.model.ts`:

```typescript
export interface Game {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  coverImageUrl: string;
  screenshotUrls: string[];
  samplePackageUrl: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

Note there is no `isFree` boolean and no `developer` string on this model:
- Free vs. paid is always derived from `price === 0` — see `DownloadButtonComponent`'s `isFree` computed signal in the [Download Flow Tutorial](./tutorial-download-flow.md).
- The creator's display name is resolved separately, by looking up `ownerId` through `UsersDataService` — see [How to Build Catalog & Game Detail Views](./howto-catalog-detail.md#6-resolve-the-creator-display-name).

This is the full model you'll use for the rest of the project — see the [Data Models Reference](./reference-data-models.md) for field-by-field details, validation rules, and the soft-delete pattern (`deletedAt`).

## Step 6: Create the DI Token and Mock Service

We use Angular's Dependency Injection (DI) to abstract our data layer. This allows us to easily swap out the mock implementation later. For more details, see the [DI Abstraction Explanation](./explanation-di-abstraction.md).

> Naming note: every data service in this project follows the `{DOMAIN}_DATA` token / `{Domain}DataService` interface / `Mock{Domain}DataService` class convention, registered under `core/data/`. This is the convention used in every later guide and reference doc — see the [API Services Reference](./reference-api-services.md) and the [Pages & Components Map](./pages_components_map.md#file-path-summary) — so we use it starting here rather than introducing a one-off name.

First, create the token `src/app/core/data/tokens.ts`:

```typescript
import { InjectionToken } from '@angular/core';
import { Game } from '../models/game.model';
import { Observable } from 'rxjs';

export interface GamesDataService {
  getGames(): Observable<Game[]>;
}

export const GAMES_DATA = new InjectionToken<GamesDataService>('GAMES_DATA');
```

Next, generate the mock service:

```bash
ng generate service core/data/games/mock-games-data
```

Update `src/app/core/data/games/mock-games-data.service.ts` to implement the interface:

```typescript
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { GamesDataService } from '../tokens';
import { Game } from '../../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class MockGamesDataService implements GamesDataService {
  getGames(): Observable<Game[]> {
    return of([
      {
        id: '1',
        ownerId: 'usr_1',
        title: 'Neon Racer',
        description: 'An arcade-style racer with a synthwave soundtrack.',
        tags: ['racing', 'arcade'],
        price: 0,
        coverImageUrl: '/assets/neon-racer.jpg',
        screenshotUrls: [],
        samplePackageUrl: 'assets/sample-packages/neon-racer.zip',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
  }
}
```

## What You Built

You have successfully:
1. Created an Angular 17+ standalone project
2. Established the feature-based folder structure
3. Configured the application design tokens
4. Created the base `Game` model
5. Set up a mock data layer using Dependency Injection

Next, check out [Tutorial: Download Flow](./tutorial-download-flow.md) to build the core marketplace functionality, or review the [API Services Reference](./reference-api-services.md).

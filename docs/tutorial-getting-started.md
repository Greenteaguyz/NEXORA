# Tutorial: Getting started with NEXORA

This tutorial walks you through setting up NEXORA from scratch to a running Angular 17+ application.

---

## Before you begin

Verify that your system meets the following requirements:

* **Node.js**: Version 18.13.0 or later.
* **Angular CLI**: Version 17.0.0 or later.

Run the following commands to check your installed versions:

```bash
node -v
ng version
```

---

## Step 1: Create the Angular application

NEXORA uses Angular standalone components. Create the workspace using the Angular CLI:

```bash
ng new nexora --standalone
cd nexora
```

---

## Step 2: Start the development server

Start the Angular local development server:

```bash
ng serve
```

Open your browser and navigate to [`http://localhost:4200`](http://localhost:4200). The default Angular landing page displays.

Press `Ctrl+C` in your terminal to stop the server before continuing to the next step.

---

## Step 3: Configure the folder structure

NEXORA organizes code by feature and architectural layer. Create the core folders:

```bash
mkdir src/app/core
mkdir src/app/shared
mkdir src/app/features
mkdir src/app/layout
```

---

## Step 4: Configure CSS design tokens

NEXORA uses custom CSS properties for its cyberpunk and indie game theme. Open `src/styles.css` and define the custom properties:

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

  /* Surfaces and Backgrounds */
  --bg-void:       #0B0D13;
  --bg-surface:    #131622;
  --bg-elevated:   #1A1E2E;
  --bg-input:      #0E111B;

  /* Semantic Text Colors */
  --text-primary:   #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted:     #64748B;

  /* Borders and Glow Effects */
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

---

## Step 5: Create the game data model

Define the TypeScript interface representing a game listing. Create `src/app/core/models/game.model.ts`:

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

**Note:** The model does not include an `isFree` boolean or a `developer` string:
* Free status is computed dynamically where `price === 0`.
* The creator's display name is resolved through `UsersDataService` using `ownerId`.

For complete interface definitions, see the [Data Models Reference](./reference-data-models.md).

---

## Step 6: Create the DI token and mock service

NEXORA abstracts data sources using Angular `InjectionToken` definitions. This enables swapping mock data for live HTTP endpoints without modifying UI components.

1. Create `src/app/core/data/tokens.ts`:
   ```typescript
   import { InjectionToken } from '@angular/core';
   import { Game } from '../models/game.model';
   import { Observable } from 'rxjs';

   export interface GamesDataService {
     getGames(): Observable<Game[]>;
   }

   export const GAMES_DATA = new InjectionToken<GamesDataService>('GAMES_DATA');
   ```

2. Generate the mock service:
   ```bash
   ng generate service core/data/games/mock-games-data
   ```

3. Update `src/app/core/data/games/mock-games-data.service.ts`:
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

---

## Step 7: Build for production and deployment

### 1. Build the production assets
Compile the optimized production bundles:

```bash
npm run build
```

Compiled bundles output to `dist/nexora/browser`.

### 2. Preview on mobile devices (Local network)
Test touch interactions and responsive layouts on a physical mobile device over local Wi-Fi:

```bash
npm start -- --host 0.0.0.0
```

Open `http://YOUR_LOCAL_IP:4200` in your mobile browser.

### 3. Deploy to Vercel
Deploy the build using the included [`vercel.json`](../vercel.json):

```bash
npx vercel --prod
```

---

## Summary and next steps

You have completed the initial setup:
1. Created an Angular 17+ standalone project.
2. Structured directories using feature modules and clean architecture.
3. Configured cyberpunk theme design tokens in `src/styles.css`.
4. Defined the `Game` interface and `GAMES_DATA` injection token.
5. Implemented a mock data service.
6. Compiled production assets and verified deployment settings.

To build the gated download button, proceed to [Tutorial: Implementing the Gated Download Flow](./tutorial-download-flow.md).



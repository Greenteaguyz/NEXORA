# Tutorial: Implementing the gated download flow

The gated download flow is a core feature in NEXORA. This tutorial walks you through building the complete download chain, from an unauthenticated user clicking the download button to delivering a local file.

For architectural design context, see [Architecture of the Gated Download Flow](./explanation-download-flow.md).

---

## Before you begin

Ensure you have completed [Tutorial: Getting Started](./tutorial-getting-started.md) and created the core data models and service tokens.

---

## Download state machine

The download button component manages five distinct states:

1. **Anonymous user**: Directs user to the login screen with a `returnUrl` parameter.
2. **Free, unowned game**: Adds the game to the user's library and initiates the download.
3. **Paid, unowned game**: Opens the purchase confirmation modal, creates an order, adds the title to the library, and initiates the download.
4. **Owned game**: Directly initiates the file download.
5. **Deleted game**: Displays an "Unavailable" disabled state.

---

## Step 1: Create the download button component

Generate a standalone component for the button:

```bash
ng generate component shared/ui/download-button
```

Update `src/app/shared/ui/download-button/download-button.component.ts`. The component calculates its label and disabled state based on its `game` and `isOwned` inputs, as well as the active `currentUser` signal from `AuthService`:

```typescript
import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Game } from '../../../core/models/game.model';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-download-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button [class]="buttonClass()" (click)="handleClick()" [disabled]="isDeleted()">
      {{ buttonText() }}
    </button>
  `
})
export class DownloadButtonComponent {
  @Input({ required: true }) game!: Game;
  @Input({ required: true }) isOwned!: boolean;

  @Output() download = new EventEmitter<void>();
  @Output() loginRequired = new EventEmitter<void>();
  @Output() purchaseConfirmed = new EventEmitter<void>();

  private auth = inject(AuthService);

  isDeleted = computed(() => !!this.game.deletedAt);
  isLoggedIn = computed(() => this.auth.currentUser() !== null);
  isFree = computed(() => this.game.price === 0);

  buttonText = computed(() => {
    if (this.isDeleted()) return 'Unavailable';
    if (this.isOwned) return 'Download';
    if (!this.isLoggedIn()) return 'Download';
    if (this.isFree()) return 'Download Free';
    return `Buy $${this.game.price.toFixed(2)}`;
  });

  buttonClass = computed(() => {
    return this.isFree() || this.isOwned ? 'btn-primary' : 'btn-accent';
  });

  handleClick() {
    if (this.isDeleted()) return;

    if (!this.isLoggedIn()) {
      this.loginRequired.emit();
      return;
    }

    if (this.isOwned || this.isFree()) {
      this.download.emit();
      return;
    }

    this.purchaseConfirmed.emit();
  }
}
```

---

## Step 2: Handle login redirects in GameDetailComponent

`GameDetailComponent` manages page-level navigation. It captures the button's `loginRequired` event and navigates to the login route, preserving the current page via query parameters:

```typescript
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DownloadButtonComponent } from '../../shared/ui/download-button/download-button.component';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [DownloadButtonComponent],
  template: `
    <app-download-button
      [game]="game()!"
      [isOwned]="isOwned()"
      (loginRequired)="onLoginRequired()"
      (download)="onDownload()"
      (purchaseConfirmed)="onPurchaseConfirmed()">
    </app-download-button>
  `
})
export class GameDetailComponent {
  private router = inject(Router);

  onLoginRequired() {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }
}
```

For routing rules, see the [Routes & Guards Reference](./reference-routes-guards.md).

---

## Step 3: Implement free and owned download paths

When an owned or free game is clicked, the button emits `download`. `GameDetailComponent` injects `LIBRARY_DATA` and `DownloadService` to process the file delivery:

```typescript
import { inject } from '@angular/core';
import { LIBRARY_DATA } from '../../core/data/tokens';
import { DownloadService } from '../../core/services/download.service';
import { AuthService } from '../../core/auth/auth.service';

export class GameDetailComponent {
  private library = inject(LIBRARY_DATA);
  private downloadService = inject(DownloadService);
  private auth = inject(AuthService);

  onDownload() {
    const userId = this.auth.currentUser()!.id;
    const game = this.game()!;

    if (this.isOwned()) {
      this.triggerDownload(game.id);
      return;
    }

    this.library.addToLibrary(userId, game.id).subscribe(() => {
      this.isOwned.set(true);
      this.triggerDownload(game.id);
    });
  }

  private triggerDownload(gameId: string) {
    this.downloadService.downloadGameFile(gameId);
  }
}
```

---

## Step 4: Implement the paid purchase flow

For paid games, `purchaseConfirmed` signals `GameDetailComponent` to open `PurchaseConfirmModalComponent`:

```typescript
import { signal, inject } from '@angular/core';
import { ORDERS_DATA } from '../../core/data/tokens';

export class GameDetailComponent {
  private orders = inject(ORDERS_DATA);
  showPurchaseModal = signal(false);

  onPurchaseConfirmed() {
    this.showPurchaseModal.set(true);
  }

  onModalConfirm() {
    const userId = this.auth.currentUser()!.id;
    const game = this.game()!;

    this.orders.createOrder(userId, game.id).subscribe(order => {
      this.library.addToLibrary(userId, game.id, order.id).subscribe(() => {
        this.isOwned.set(true);
        this.showPurchaseModal.set(false);
        this.triggerDownload(game.id);
      });
    });
  }

  onModalCancel() {
    this.showPurchaseModal.set(false);
  }
}
```

```html
@if (showPurchaseModal()) {
  <app-purchase-confirm-modal
    [game]="game()!"
    (confirm)="onModalConfirm()"
    (cancel)="onModalCancel()">
  </app-purchase-confirm-modal>
}
```

---

## Step 5: Wire the library page

The Library page displays games that the user already owns. `LibraryComponent` passes `[isOwned]="true"` and binds the `download` output event:

1. Generate the library component:
   ```bash
   ng generate component features/library
   ```

2. Update `src/app/features/library/library.component.ts`:
   ```typescript
   import { Component, inject } from '@angular/core';
   import { CommonModule } from '@angular/common';
   import { LIBRARY_DATA } from '../../core/data/tokens';
   import { DownloadService } from '../../core/services/download.service';
   import { DownloadButtonComponent } from '../../shared/ui/download-button/download-button.component';

   @Component({
     selector: 'app-library',
     standalone: true,
     imports: [CommonModule, DownloadButtonComponent],
     template: `
       <div class="library-container">
         <h2>My Games</h2>
         <div class="game-grid">
           @for (entry of libraryEntries(); track entry.game.id) {
             <div class="game-card">
               <h3>{{ entry.game.title }}</h3>
               <app-download-button
                 [game]="entry.game"
                 [isOwned]="true"
                 (download)="downloadService.downloadGameFile(entry.game.id)">
               </app-download-button>
             </div>
           }
         </div>
       </div>
     `
   })
   export class LibraryComponent {
     private libraryData = inject(LIBRARY_DATA);
     protected downloadService = inject(DownloadService);
     libraryEntries = /* ... */ null!;
   }
   ```

---

## Step 6: Verify soft-deletion handling

When creators unpublish a game, `deleteGame()` assigns a timestamp to `Game.deletedAt`. Because `DownloadButtonComponent` computes `isDeleted = computed(() => !!this.game.deletedAt)`, the button automatically disables itself and displays **Unavailable** without requiring custom logic on parent views.

---

## Summary and next steps

You have implemented:
1. Presentational state rendering in `DownloadButtonComponent`.
2. Auth redirection with query parameter preservation in `GameDetailComponent`.
3. Unified library acquisition for free and paid titles.
4. Download integration on both catalog and library pages.

To review service contracts, see the [API & Data Services Reference](./reference-api-services.md).

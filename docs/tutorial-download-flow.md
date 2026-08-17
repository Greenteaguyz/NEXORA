# Tutorial: Implementing the Download Flow

The gated download flow is the showcase feature of **NEXORA**. This tutorial walks you through building the complete chain, from an anonymous user clicking a download button to delivering the file.

For architectural context, review the [Download Flow Explanation](./explanation-download-flow.md).

## What You Will Build

You will implement a **presentational** `DownloadButtonComponent` and wire it into `GameDetailComponent`, which owns the actual auth, library, order, and file-download service calls. The button only knows about the `game` and `isOwned` inputs it's given; it emits `download`, `loginRequired`, or `purchaseConfirmed` events, and the page component listens for those events to perform the corresponding data mutation. This keeps the button reusable on both the Game Detail and Library pages — see its full input/output contract in the [Pages & Components Map](./pages_components_map.md).

You will implement all five states:
1. Anonymous user (redirects to login)
2. Free, unowned game (adds to library, triggers download)
3. Paid, unowned game (opens purchase confirmation, adds to library, triggers download)
4. Owned game (triggers download directly)
5. Deleted game (shows unavailable status)

## Step 1: Create the Download Button Component

Generate a new standalone component for the button:

```bash
ng generate component shared/ui/download-button
```

Update `src/app/shared/ui/download-button/download-button.component.ts`. The button computes its label and disabled state purely from its `game` and `isOwned` inputs, plus the shared `currentUser` signal it reads (but never mutates) from `AuthService`:

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

  // `deletedAt` (not a `status` string) marks a soft-deleted game — see reference-data-models.md
  isDeleted = computed(() => !!this.game.deletedAt);
  isLoggedIn = computed(() => this.auth.currentUser() !== null);
  // `price === 0` (not a separate `isFree` flag) marks a free game — see reference-data-models.md
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

    // Paid + unowned: the button doesn't own the purchase modal (see Step 4),
    // it just tells the parent the buy flow should start.
    this.purchaseConfirmed.emit();
  }
}
```

Notice this component never injects `Router`, `LibraryDataService`, `OrderService`, or `DownloadService` — those all belong to the page component that hosts the button, wired up next.

## Step 2: Handle Login Redirects in GameDetailComponent

`GameDetailComponent` owns navigation. It listens for the button's `loginRequired` output and redirects, preserving the current page via `returnUrl`.

```typescript
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DownloadButtonComponent } from '../../shared/ui/download-button/download-button.component';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [DownloadButtonComponent /* ...other imports */],
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

For more details on routing, see the [Routes and Guards Reference](./reference-routes-guards.md).

## Step 3: Implement the Free & Owned Download Paths

The button emits `download` in two cases: the game is already owned, or it's free and unowned. `GameDetailComponent` injects the `LIBRARY_DATA` token and a `DownloadService` to complete either path.

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

    // Unowned only reaches here for free games — the button routes paid +
    // unowned clicks to purchaseConfirmed() instead (see Step 4).
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

## Step 4: Implement the Paid Purchase Path

For paid games, `purchaseConfirmed` tells `GameDetailComponent` to open `PurchaseConfirmModalComponent`. The modal is rendered as a sibling of the download button, not nested inside it — this is what lets the same `DownloadButtonComponent` be reused on the Library page, which never needs a purchase modal.

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

## Step 5: Wire the Library Page

The library page displays the user's owned games. Every entry here is, by definition, owned — `LibraryComponent` always passes `[isOwned]="true"` and only needs to handle the `download` output, since `loginRequired` and `purchaseConfirmed` can never fire behind `authGuard`.

Generate the component:

```bash
ng generate component features/library
```

Update `src/app/features/library/library.component.ts`:

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
  // Enriched signal combining LibraryEntry with its resolved Game record —
  // see LIBRARY_DATA.getLibrary() and GAMES_DATA.getGameById() in
  // reference-api-services.md.
  libraryEntries = /* ... */ null!;
}
```

## Step 6: Handle Soft-Deleted Games

Creators can unpublish games via the soft-delete pattern described in the [Data Models Reference](./reference-data-models.md): `deleteGame()` sets `Game.deletedAt` rather than removing the record. Because `DownloadButtonComponent`'s `isDeleted` signal already reads `game.deletedAt` (Step 1), the button automatically disables itself and displays "Unavailable" once a game's `deletedAt` field is populated — on the Game Detail page and on the Library page alike. No extra wiring is needed here.

## What You Built

You successfully implemented a robust download flow that gracefully handles all possible states:

1. **Authentication:** The button emits `loginRequired`; the page owns the redirect and the `returnUrl`.
2. **Purchasing:** The button emits `purchaseConfirmed`; the page owns the modal, the order creation, and the library entry.
3. **Library Management:** Both the free and paid paths converge on the same `LIBRARY_DATA.addToLibrary()` call.
4. **Resiliency:** `game.deletedAt` disables the button no matter which page renders it.

Next, check out the [Data Models Reference](./reference-data-models.md) or explore the details of the [DI Abstraction](./explanation-di-abstraction.md).

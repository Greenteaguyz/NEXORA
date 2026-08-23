import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig, withInMemoryScrolling, withPreloading, PreloadAllModules } from '@angular/router';
import { routes } from './app.routes';
import { GAMES_DATA, LIBRARY_DATA, ORDERS_DATA, USERS_DATA, WISHLIST_DATA } from './core/data/tokens';
import { MockGamesDataService } from './core/data/games/mock-games-data.service';
import { MockLibraryDataService } from './core/data/library/mock-library-data.service';
import { MockOrdersDataService } from './core/data/orders/mock-orders-data.service';
import { MockUsersDataService } from './core/data/users/mock-users-data.service';
import { MockWishlistDataService } from './core/data/wishlist/mock-wishlist-data.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({ onSameUrlNavigation: 'ignore' }),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withPreloading(PreloadAllModules)
    ),
    { provide: GAMES_DATA, useClass: MockGamesDataService },
    { provide: LIBRARY_DATA, useClass: MockLibraryDataService },
    { provide: ORDERS_DATA, useClass: MockOrdersDataService },
    { provide: USERS_DATA, useClass: MockUsersDataService },
    { provide: WISHLIST_DATA, useClass: MockWishlistDataService }
  ]
};

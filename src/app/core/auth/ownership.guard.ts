import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';
import { GAMES_DATA } from '../data/tokens';
import { sanitizeReturnUrl } from './return-url.util';

export const ownershipGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const gamesService = inject(GAMES_DATA);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  const gameId = route.paramMap.get('id');

  // Not signed in -> login with sanitized returnUrl and explicit reason.
  if (!currentUser) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: sanitizeReturnUrl(state.url), reason: 'auth-required' }
    });
  }

  // Signed in without creator access -> public catalog with reason hint.
  if (!currentUser.roles.includes('creator')) {
    return router.createUrlTree(['/catalog'], {
      queryParams: { reason: 'creator-required' }
    });
  }

  // Creator, but no game id to resolve -> treat as not owning anything.
  if (!gameId) {
    return router.createUrlTree(['/studio'], {
      queryParams: { reason: 'not-owner' }
    });
  }

  return gamesService.getGameById(gameId).pipe(
    map(game => {
      if (game && game.ownerId === currentUser.id) {
        return true;
      }
      // Creator, but the game is missing or owned by someone else.
      return router.createUrlTree(['/studio'], {
        queryParams: { reason: 'not-owner' }
      });
    })
  );
};

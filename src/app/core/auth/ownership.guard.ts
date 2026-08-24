import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';
import { GAMES_DATA } from '../data/tokens';

export const ownershipGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const gamesService = inject(GAMES_DATA);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  const gameId = route.paramMap.get('id');

  if (!currentUser || !gameId) {
    return router.createUrlTree(['/studio']);
  }

  return gamesService.getGameById(gameId).pipe(
    map(game => {
      if (game && game.ownerId === currentUser.id) {
        return true;
      }
      return router.createUrlTree(['/studio']);
    })
  );
};

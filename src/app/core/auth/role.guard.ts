import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';
import { sanitizeReturnUrl } from './return-url.util';

export function roleGuard(requiredRole: UserRole): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();

    if (user && user.roles.includes(requiredRole)) {
      return true;
    }

    // Not signed in at all -> login with a sanitized returnUrl;
    // 'reason' drives the explicit feedback toast in the shell.
    if (!user) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: sanitizeReturnUrl(state.url), reason: 'auth-required' }
      });
    }

    // Signed in but lacking the role -> public catalog with a 'creator-required' hint.
    return router.createUrlTree(['/catalog'], {
      queryParams: { reason: 'creator-required' }
    });
  };
}

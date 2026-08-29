import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { sanitizeReturnUrl } from './return-url.util';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Preserve a sanitized returnUrl for seamless redirect after login;
  // 'reason' drives the explicit sign-in feedback toast in the shell.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: sanitizeReturnUrl(state.url), reason: 'auth-required' }
  });
};

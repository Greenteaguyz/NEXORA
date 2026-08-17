import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

export function roleGuard(requiredRole: UserRole): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();
    if (user && user.roles.includes(requiredRole)) {
      return true;
    }

    // Unauthorized role -> redirect to public catalog
    return router.createUrlTree(['/catalog']);
  };
}

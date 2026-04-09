import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    return router.createUrlTree(['/login']);
  }

  if (authService.shouldForcePasswordChange()) {
    return router.createUrlTree(['/change-password']);
  }

  return true;
};

export const passwordChangeGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    return router.createUrlTree(['/login']);
  }

  return true;
};

export const publicOnlyGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    return true;
  }

  if (authService.shouldForcePasswordChange()) {
    return router.createUrlTree(['/change-password']);
  }

  return router.createUrlTree(['/dashboard']);
};

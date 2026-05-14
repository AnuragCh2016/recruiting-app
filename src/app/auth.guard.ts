import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    // state.url preserves the path AND the query params (?ref=...)
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
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

export const publicOnlyGuard: CanActivateFn = (
  route,
  state,
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    return true;
  }

  // If they are already logged in but hit login with a returnUrl, send them there
  const returnUrl = route.queryParams['returnUrl'];
  if (returnUrl) {
    return router.createUrlTree([returnUrl]);
  }

  if (authService.shouldForcePasswordChange()) {
    return router.createUrlTree(['/change-password']);
  }

  return router.createUrlTree(['/dashboard']);
};

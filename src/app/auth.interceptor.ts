import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  // Clone the request if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Handle the request and pipe the response to check for errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/auth/login');

      if (error.status === 401 && !isLoginRequest) {
        console.warn('Token expired or unauthorized. Logging out...');

        // 1. Clear local storage
        localStorage.removeItem('access_token');

        // 2. Redirect to login with a query param to show a message
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url, expired: true },
        });
      }

      return throwError(() => error);
    }),
  );
};

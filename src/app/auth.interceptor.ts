import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Grab the token from localStorage
  const token = localStorage.getItem('access_token');

  // 2. If token exists, clone the request and add the Bearer header
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq);
  }

  // 3. If no token, just pass the original request through
  return next(req);
};

// camel-case.interceptor.ts
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

// Helper to convert string
const toCamel = (s: string) =>
  s.replace(/([-_][a-z])/gi, ($1) =>
    $1.toUpperCase().replace('-', '').replace('_', ''),
  );
const toSnake = (s: string) =>
  s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// Recursive object transformer
const transformKeys = (obj: any, transformer: (s: string) => string): any => {
  if (Array.isArray(obj)) return obj.map((v) => transformKeys(v, transformer));
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [transformer(key)]: transformKeys(obj[key], transformer),
      }),
      {},
    );
  }
  return obj;
};

export const camelCaseInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Convert outgoing Request Body to snake_case
  let body = req.body;
  if (body) {
    body = transformKeys(body, toSnake);
  }

  const clonedReq = req.clone({ body });

  // 2. Convert incoming Response Body to camelCase
  return next(clonedReq).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body) {
        return event.clone({ body: transformKeys(event.body, toCamel) });
      }
      return event;
    }),
  );
};

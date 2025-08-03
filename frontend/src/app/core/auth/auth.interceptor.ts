import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, switchMap, throwError} from 'rxjs';
import {AuthService} from './auth.service';

/**
 * Functional HTTP interceptor for handling authentication
 * Automatically adds JWT token to requests and handles token refresh
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip auth header for auth endpoints
  const isAuthEndpoint = req.url.includes('/auth/');
  if (isAuthEndpoint) {
    return next(req);
  }

  // Get the token
  const token = authService.getStoredToken();

  // Clone request and add authorization header if token exists
  const authReq = token ? req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }) : req;

  return next(authReq).pipe(
    catchError(error => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && token) {
        // Try to refresh the token
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Retry the original request with new token
            const newToken = authService.getStoredToken();
            const retryReq = newToken ? req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            }) : req;

            return next(retryReq);
          }),
          catchError(refreshError => {
            // If refresh fails, logout user
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      // For other errors, just pass them through
      return throwError(() => error);
    })
  );
};

/**
 * Benefits of Functional Interceptors:
 *
 * 1. **Simpler syntax**: No class boilerplate
 * 2. **Better performance**: Direct function calls
 * 3. **Easier composition**: Can be combined easily
 * 4. **Modern Angular**: Recommended approach in v17+
 * 5. **Type safety**: Better TypeScript integration
 */

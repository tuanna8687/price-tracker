import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {CanActivateFn} from '@angular/router';
import {AuthService} from './auth.service';

/**
 * Functional guard for protecting authenticated routes
 * Uses Angular 17's new functional guard approach
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const returnUrl = state.url;
  router.navigate(['/auth/login'], {
    queryParams: {returnUrl},
    replaceUrl: true
  });

  return false;
};

/**
 * Guard for preventing authenticated users from accessing auth pages
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is already authenticated, redirect to dashboard
  if (authService.isAuthenticated()) {
    router.navigate(['/dashboard'], {replaceUrl: true});
    return false;
  }

  return true;
};

/**
 * Why Functional Guards?
 *
 * 1. **Simpler**: No need to create classes
 * 2. **Better tree-shaking**: Only imported when needed
 * 3. **Easier testing**: Pure functions are easier to test
 * 4. **Angular 17+ recommended**: Modern Angular approach
 * 5. **Dependency injection**: Still works with inject() function
 */

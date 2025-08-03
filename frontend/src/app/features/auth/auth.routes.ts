import {Routes} from '@angular/router';
import {guestGuard} from '../../core/auth/auth.guard';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Sign In - Price Tracker'
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
    title: 'Sign Up - Price Tracker'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
    title: 'Reset Password - Price Tracker'
  }
];

/**
 * Route Features Explained:
 *
 * 1. **Lazy Loading**: Components are loaded only when needed
 * 2. **Guest Guard**: Prevents authenticated users from accessing auth pages
 * 3. **Dynamic Titles**: Each route has a descriptive page title
 * 4. **Redirect**: Default auth route redirects to login
 */

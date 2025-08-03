import {Routes} from '@angular/router';
import {authGuard} from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  }
  // {
  //   path: 'products',
  //   loadChildren: () => import('./features/products/products.routes').then(m => m.productsRoutes),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: 'profile',
  //   loadComponent: () => import('./features/profile/user-profile/user-profile.component').then(m => m.UserProfileComponent),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: '**',
  //   loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  // }
];

// Explanation of Route Features:
// 1. Lazy Loading: All feature modules are loaded on-demand for better performance
// 2. Route Guards: Protect authenticated routes with authGuard
// 3. Standalone Components: Modern Angular 17+ approach
// 4. Modular Structure: Each feature has its own routing file

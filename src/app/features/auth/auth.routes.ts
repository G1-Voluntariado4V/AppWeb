import { Routes } from '@angular/router';

export const AUTH_CHILD_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    // canActivate: [GuestGuard],
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    // canActivate: [GuestGuard],
    loadComponent: () => import('./pages/register/register').then(m => m.Register)
  },
  {
    path: 'status',
    // canActivate: [AuthGuard],
    loadComponent: () => import('./pages/status/status').then(m => m.StatusPage)
  },
  {
    path: 'callback',
    // canActivate: [AuthGuard],
    loadComponent: () => import('./pages/callback/callback').then(m => m.CallbackPage)
  },
  {
    path: 'logout',
    loadComponent: () => import('./pages/logout/logout').then(m => m.LogoutPage)
  },
  {
    path: 'access-denied',
    loadComponent: () => import('./pages/access-denied/access-denied').then(m => m.AccessDeniedPage)
  }

];

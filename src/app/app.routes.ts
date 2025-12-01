import { Routes } from '@angular/router';
import { AUTH_CHILD_ROUTES } from './features/auth/auth.routes';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/layout/landing-layout').then(m => m.LandingLayout)
  },
  {
    path: 'auth', loadComponent: () => import('./features/auth/layout/auth-layout').then(m => m.AuthLayout),
    children: AUTH_CHILD_ROUTES

  },
  {
    path: '**',
    loadComponent: () => import('./features/errors/pages/not-found/not-found').then(m => m.NotFoundPage)
  }
];

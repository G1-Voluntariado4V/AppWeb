import { Routes } from '@angular/router';

export const AUTH_CHILD_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    // canActivate: [GuestGuard],
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },

];

import { Routes } from '@angular/router';
import { AUTH_CHILD_ROUTES } from './features/auth/auth.routes';

export const routes: Routes = [
  // 1. Ruta por defecto (Landing Page) - ESTO YA ESTABA
  {
    path: '',
    loadComponent: () => import('./features/landing/layout/landing-layout').then(m => m.LandingLayout)
  },

  // 2. NUEVA RUTA: Voluntario (Para que funcione el botón "Soy Voluntario")
  // Se coloca antes del comodín '**' para que Angular la encuentre.
  {
    path: 'voluntario',
    loadChildren: () => import('./features/voluntario/voluntario.routes').then(m => m.VOLUNTARIO_ROUTES)
  },

  // 3. Ruta de Autenticación - ESTO YA ESTABA
  {
    path: 'auth', 
    loadComponent: () => import('./features/auth/layout/auth-layout').then(m => m.AuthLayout),
    children: AUTH_CHILD_ROUTES
  },

  // 4. Ruta Comodín (Error 404) - SIEMPRE AL FINAL
  {
    path: '**',
    loadComponent: () => import('./features/errors/pages/not-found/not-found').then(m => m.NotFoundPage)
  }
];
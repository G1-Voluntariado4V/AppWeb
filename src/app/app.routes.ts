import { Routes } from '@angular/router';
import { AUTH_CHILD_ROUTES } from './features/auth/auth.routes';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // 1. Ruta por defecto (Landing Page)
  {
    path: '',
    loadComponent: () => import('./features/landing/layout/landing-layout').then(m => m.LandingLayout)
  },

  // 2. Ruta VOLUNTARIO
  {
    path: 'voluntario',
    loadChildren: () => import('./features/voluntario/voluntario.routes').then(m => m.VOLUNTARIO_ROUTES),
    canActivate: [authGuard],
    data: { roles: ['Voluntario'] }
  },

  // 3. Ruta COORDINADOR
  {
    path: 'coordinador',
    loadChildren: () => import('./features/coordinador/coordinador.routes').then(m => m.COORDINADOR_ROUTES),
    canActivate: [authGuard],
    data: { roles: ['Coordinador'] }
  },

  // 4. NUEVA RUTA: ORGANIZACION (Añadida aquí)
  {
    path: 'organizacion',
    loadChildren: () => import('./features/organizacion/organizacion.routes').then(m => m.ORGANIZACION_ROUTES),
    canActivate: [authGuard],
    data: { roles: ['Organizacion', 'Organización', 'Organizador'] }
  },

  // 5. Ruta de Autenticación
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/layout/auth-layout').then(m => m.AuthLayout),
    children: AUTH_CHILD_ROUTES
  },

  // 6. Ruta Comodín (Error 404) - SIEMPRE AL FINAL
  {
    path: '**',
    loadComponent: () => import('./features/errors/pages/not-found/not-found').then(m => m.NotFoundPage)
  }
];
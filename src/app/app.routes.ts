import { Routes } from '@angular/router';
import { AUTH_CHILD_ROUTES } from './features/auth/auth.routes';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // 1. Ruta por defecto (Landing Page) - Pública
  {
    path: '',
    loadComponent: () => import('./features/landing/layout/landing-layout').then(m => m.LandingLayout)
  },

  // 2. Ruta VOLUNTARIO - Protegida (solo voluntarios)
  {
    path: 'voluntario',
    canActivate: [authGuard],
    data: { roles: ['Voluntario'] },
    loadChildren: () => import('./features/voluntario/voluntario.routes').then(m => m.VOLUNTARIO_ROUTES),
  },

  // 3. Ruta COORDINADOR - Protegida (solo coordinadores)
  {
    path: 'coordinador',
    canActivate: [authGuard],
    data: { roles: ['Coordinador'] },
    loadChildren: () => import('./features/coordinador/coordinador.routes').then(m => m.COORDINADOR_ROUTES),
  },

  // 4. Ruta ORGANIZACION - Protegida (solo organizaciones)
  {
    path: 'organizacion',
    canActivate: [authGuard],
    data: { roles: ['Organizacion', 'Organizador'] },
    loadChildren: () => import('./features/organizacion/organizacion.routes').then(m => m.ORGANIZACION_ROUTES),
  },

  // 5. Ruta de Autenticación - Pública
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

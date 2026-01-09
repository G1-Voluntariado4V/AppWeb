import { Routes } from '@angular/router';
import { CoordinadorLayout } from './layout/coordinador-layout/coordinador-layout';

export const COORDINADOR_ROUTES: Routes = [
  {
    path: '',
    component: CoordinadorLayout,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },

      // 1. Dashboard
      {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio').then(m => m.Inicio)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil').then(m => m.Perfil)
      },

      // 2. Gestión de Actividades
      {
        path: 'actividades',
        loadComponent: () => import('./pages/actividades/actividades').then(m => m.Actividades)
      },

      // 3. Usuarios (Submenús)
      {
        path: 'usuarios/organizaciones',
        loadComponent: () => import('./pages/usuarios/organizaciones/organizaciones').then(m => m.Organizaciones)
      },
      {
        path: 'usuarios/voluntarios',
        loadComponent: () => import('./pages/usuarios/voluntarios/voluntarios').then(m => m.Voluntarios)
      },

      // 4. Aprobaciones (Submenús)
      {
        path: 'aprobaciones/organizaciones',
        loadComponent: () => import('./pages/aprobaciones/aprob-organizaciones/aprob-organizaciones').then(m => m.AprobOrganizaciones)
      },
      {
        path: 'aprobaciones/voluntarios',
        loadComponent: () => import('./pages/aprobaciones/aprob-voluntarios/aprob-voluntarios').then(m => m.AprobVoluntarios)
      },
      {
        path: 'aprobaciones/actividades',
        loadComponent: () => import('./pages/aprobaciones/aprob-actividades/aprob-actividades').then(m => m.AprobActividades)
      }
    ]
  }
];

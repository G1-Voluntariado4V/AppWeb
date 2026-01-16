import { Routes } from '@angular/router';
import { VoluntarioLayout } from './layout/voluntario-layout/voluntario-layout';

export const VOLUNTARIO_ROUTES: Routes = [
  {
    path: '',
    component: VoluntarioLayout,
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },
      {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio').then(m => m.Inicio)
      },
      {
        path: 'actividades',
        loadComponent: () => import('./pages/actividades/actividades').then(m => m.ActividadesDisponibles)
      },
      {
        path: 'historial',
        loadComponent: () => import('./pages/historial/historial').then(m => m.Historial)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil').then(m => m.Perfil)
      },
      {
        path: 'actividad/:id',
        loadComponent: () => import('./pages/actividad/actividad').then(m => m.Actividad)
      }
    ]
  }
];
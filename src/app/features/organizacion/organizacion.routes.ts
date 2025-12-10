import { Routes } from '@angular/router';
import { OrganizacionLayout } from './layout/organizacion-layout/organizacion-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Actividades } from './pages/actividades/actividades';
import { Perfil } from './pages/perfil/perfil';

export const ORGANIZACION_ROUTES: Routes = [
  {
    path: '',
    component: OrganizacionLayout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'actividades', component: Actividades },
      { path: 'perfil', component: Perfil },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
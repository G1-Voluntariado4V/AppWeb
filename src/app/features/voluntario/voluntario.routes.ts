import { Routes } from '@angular/router';
// Importamos el Layout (el marco gris con el menú lateral)
import { VoluntarioLayout } from './layout/voluntario-layout/voluntario-layout';

export const VOLUNTARIO_ROUTES: Routes = [
  {
    path: '',
    component: VoluntarioLayout, // 1. Primero carga el Layout (Sidebar + Fondo)
    children: [
      // 2. Si la ruta está vacía, redirige automáticamente a 'inicio'
      { 
        path: '', 
        redirectTo: 'inicio', 
        pathMatch: 'full' 
      },
      
      // 3. Rutas de las páginas internas
      { 
        path: 'inicio', 
        // Carga perezosa (Lazy Loading) del componente Inicio
        loadComponent: () => import('./pages/inicio/inicio').then(m => m.Inicio) 
      },
      { 
        path: 'perfil', 
        loadComponent: () => import('./pages/perfil/perfil').then(m => m.Perfil) 
      },
      { 
        path: 'historial', 
        loadComponent: () => import('./pages/historial/historial').then(m => m.Historial) 
      },
      { 
        path: 'actividad/:id', 
        loadComponent: () => import('./pages/actividad/actividad').then(m => m.Actividad) 
      }
    ]
  }
];
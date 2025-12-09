import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
// Importamos la interfaz SidebarLink para que no de error de tipos
import { Sidebar, SidebarLink } from '../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'coordinador-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './coordinador-layout.html',
})
export class CoordinadorLayout {
  
  private router = inject(Router);

  // MENÚ ESTRUCTURADO (Con desplegables)
  menuLinks = signal<SidebarLink[]>([
    { 
      label: 'Dashboard', 
      route: '/coordinador/dashboard', 
      icon: 'fa-solid fa-chart-pie' 
    },
    { 
      label: 'Actividades', 
      route: '/coordinador/actividades', 
      icon: 'fa-regular fa-calendar' 
    },
    
    // GRUPO USUARIOS
    { 
      label: 'Usuarios', 
      icon: 'fa-solid fa-users',
      children: [
        { label: 'Organizaciones', route: '/coordinador/usuarios/organizaciones', icon: '' },
        { label: 'Voluntarios', route: '/coordinador/usuarios/voluntarios', icon: '' }
      ]
    },
    
    // GRUPO APROBACIONES
    { 
      label: 'Aprobaciones', 
      icon: 'fa-solid fa-circle-check', 
      children: [
        { label: 'Organizaciones', route: '/coordinador/aprobaciones/organizaciones', icon: '' },
        { label: 'Voluntarios', route: '/coordinador/aprobaciones/voluntarios', icon: '' },
        { label: 'Actividades', route: '/coordinador/aprobaciones/actividades', icon: '' }
      ]
    },
  ]);

  usuario = signal({
    nombre: 'Admin',
    rol: 'Coordinador',
    foto: '' 
  });

  handleLogout() {
    this.router.navigate(['/']);
  }
}
import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Sidebar, SidebarLink } from '../../../../shared/components/sidebar/sidebar';
// CORRECCIÓN: Ruta correcta (subir 2 niveles)
import { CoordinadorService } from '../../services/coordinador';

@Component({
  selector: 'coordinador-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './coordinador-layout.html',
})
export class CoordinadorLayout {
  
  private router = inject(Router);
  // Inyectamos el servicio
  public coordinadorService = inject(CoordinadorService); // Poner 'public' ayuda en algunos casos de template

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
        { label: 'Organizaciones', route: '/coordinador/usuarios/organizaciones', icon: 'fa-solid fa-building' },
        { label: 'Voluntarios', route: '/coordinador/usuarios/voluntarios', icon: 'fa-solid fa-user-group' }
      ]
    },
    
    // GRUPO APROBACIONES
    { 
      label: 'Aprobaciones', 
      icon: 'fa-solid fa-circle-check', 
      children: [
        { label: 'Organizaciones', route: '/coordinador/aprobaciones/organizaciones', icon: 'fa-solid fa-building-circle-check' },
        { label: 'Voluntarios', route: '/coordinador/aprobaciones/voluntarios', icon: 'fa-solid fa-user-check' },
        { label: 'Actividades', route: '/coordinador/aprobaciones/actividades', icon: 'fa-solid fa-calendar-check' }
      ]
    },
  ]);

  // Enlazamos al servicio
  usuario = this.coordinadorService.perfilUsuario;

  handleLogout() {
    this.router.navigate(['/']);
  }
}
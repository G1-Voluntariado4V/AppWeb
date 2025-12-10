import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Sidebar, SidebarLink } from '../../../../shared/components/sidebar/sidebar';
import { OrganizacionService } from '../../services/organizacion.service';

@Component({
  selector: 'organizacion-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './organizacion-layout.html',
})
export class OrganizacionLayout {
  
  private router = inject(Router);
  public orgService = inject(OrganizacionService);

  // Menú específico para Organización (Según tu captura Frame 32)
  menuLinks = signal<SidebarLink[]>([
    { 
      label: 'Inicio', 
      route: '/organizacion/dashboard', 
      icon: 'fa-solid fa-house' 
    },
    { 
      label: 'Actividades', 
      route: '/organizacion/actividades', 
      icon: 'fa-solid fa-calendar-days' 
    },
    { 
      label: 'Mi Perfil', 
      route: '/organizacion/perfil', 
      icon: 'fa-solid fa-user' 
    }
  ]);

  // Conectamos con el perfil del servicio
  usuario = this.orgService.perfil;

  handleLogout() {
    this.router.navigate(['/']);
  }
}
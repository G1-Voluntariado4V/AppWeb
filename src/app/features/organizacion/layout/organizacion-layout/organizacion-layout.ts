import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { SidebarItem } from '@app/shared/models/interfaces/sidebarItem';
import { OrganizacionService } from '../../services/organizacion.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'organizacion-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './organizacion-layout.html',
})
export class OrganizacionLayout {

  private router = inject(Router);
  private orgService = inject(OrganizacionService);
  private authService = inject(AuthService);

  // Menú específico para Organización
  menuLinks = signal<SidebarItem[]>([
    {
      label: 'Inicio',
      route: '/organizacion/dashboard',
      icon: 'home'
    },
    {
      label: 'Actividades',
      route: '/organizacion/actividades',
      icon: 'event'
    },
  ]);

  profileLink: SidebarItem = {
    label: 'Mi perfil',
    route: '/organizacion/perfil',
    icon: 'account_circle',
  };

  // Conectamos con el perfil del servicio + foto de Google (reactivo)
  usuario = computed(() => {
    const perfil = this.orgService.perfil();
    const userProfile = this.authService.userProfile(); // Este es reactivo

    // Debug


    return {
      nombre: perfil.nombre || userProfile.nombre || 'Organización',
      rol: 'Organización',
      // PRIORIDAD: userProfile.foto (que ya prioriza Google) > perfil.foto
      foto: userProfile.foto || perfil.foto || null
    };
  });

  handleLogout() {
    this.authService.logout().finally(() => this.router.navigate(['/']));
  }
}

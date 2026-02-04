import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { CoordinadorService } from '../../services/coordinador';
import { SidebarItem } from '@app/shared/models/interfaces/sidebarItem';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'coordinador-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './coordinador-layout.html',
})
export class CoordinadorLayout {

  menuLinks = signal<SidebarItem[]>([
    { label: 'Inicio', route: '/coordinador/inicio', icon: 'home' },
    { label: "Actividades", route: '/coordinador/actividades', icon: 'event' },
    {
      label: 'Usuarios', route: '/coordinador/usuarios', icon: 'group', children: [
        { label: 'Voluntarios', route: '/coordinador/usuarios/voluntarios', icon: 'school' },
        { label: 'Organizaciones', route: '/coordinador/usuarios/organizaciones', icon: 'business' },
      ]
    },
    {
      label: 'Aprobaciones', route: '/coordinador/aprobaciones', icon: 'check_circle',
      children: [
        { label: 'Voluntarios', route: '/coordinador/aprobaciones/voluntarios', icon: 'school' },
        { label: 'Organizaciones', route: '/coordinador/aprobaciones/organizaciones', icon: 'business' },
        { label: 'Actividades', route: '/coordinador/aprobaciones/actividades', icon: 'event' },
        { label: 'Inscripciones', route: '/coordinador/aprobaciones/inscripciones', icon: 'person_add' },
      ]
    },

  ]);

  profileLink: SidebarItem = {
    label: 'Mi perfil',
    route: '/coordinador/perfil',
    icon: 'account_circle',
  };

  private router = inject(Router);
  private authService = inject(AuthService);
  public coordinadorService = inject(CoordinadorService);

  // Computed para asegurar foto de Google tiene prioridad
  usuario = computed(() => {
    const perfil = this.coordinadorService.perfilUsuario();
    const googlePhoto = this.authService.getGooglePhoto();

    // Unir nombre y apellidos para la visualización en el layout
    const nombreFull = [perfil.nombre, perfil.apellidos].filter(Boolean).join(' ');

    return {
      nombre: nombreFull || 'Coordinador',
      rol: perfil.cargo,
      email: perfil.email,
      telefono: perfil.telefono,
      // PRIORIDAD: Google photo > Backend photo
      foto: googlePhoto || perfil.foto
    };
  });

  handleLogout() {
    this.authService.logout().finally(() => this.router.navigate(['/']));
  }
}

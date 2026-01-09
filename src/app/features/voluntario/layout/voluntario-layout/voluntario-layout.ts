import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Sidebar } from '../../../../shared/components/sidebar/sidebar';
import { SidebarItem } from '@app/shared/models/interfaces/sidebarItem';
import { VoluntarioService } from '../../services/voluntario.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'voluntario-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './voluntario-layout.html',
})
export class VoluntarioLayout {

  private router = inject(Router);
  private voluntarioService = inject(VoluntarioService);
  private authService = inject(AuthService);

  menuLinks = signal<SidebarItem[]>([
    { label: 'Inicio', route: '/voluntario/inicio', icon: 'home' },
    { label: 'Historial', route: '/voluntario/historial', icon: 'history' },
  ]);

  profileLink: SidebarItem = {
    label: 'Mi perfil',
    route: '/voluntario/perfil',
    icon: 'account_circle',
  };

  // Conectamos con la señal global del servicio + foto de Google
  usuario = computed(() => {
    const datos = this.voluntarioService.perfilSignal();
    const googlePhoto = this.authService.getGooglePhoto();

    // Formateamos el nombre (Ej: "Juan G." o nombre completo si hay)
    const nombreCompleto = [datos.nombre, datos.apellidos].filter(Boolean).join(' ').trim();
    const nombreCorto = datos.apellidos
      ? `${datos.nombre} ${datos.apellidos.charAt(0)}.`
      : datos.nombre;

    return {
      nombre: nombreCorto || nombreCompleto || 'Voluntario',
      rol: 'Voluntario',
      // PRIORIDAD: Google photo > Backend photo
      foto: googlePhoto || datos.foto || ''
    };
  });

  handleLogout() {
    this.authService.logout().finally(() => this.router.navigate(['/']));
  }
}

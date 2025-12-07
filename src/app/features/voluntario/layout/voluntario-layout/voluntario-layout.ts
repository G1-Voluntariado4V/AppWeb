import { Component, signal, inject, computed } from '@angular/core'; // 1. Añadimos computed
import { RouterOutlet, Router } from '@angular/router';
import { Sidebar, SidebarLink } from '../../../../shared/components/sidebar/sidebar';
// 2. Importamos el servicio para escuchar los cambios de perfil
import { VoluntarioService } from '../../services/voluntario.service';

@Component({
  selector: 'voluntario-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './voluntario-layout.html',
})
export class VoluntarioLayout {
  
  private router = inject(Router);
  // 3. Inyectamos el servicio
  private voluntarioService = inject(VoluntarioService);
  
  menuLinks = signal<SidebarLink[]>([
    { label: 'Inicio', route: '/voluntario/inicio', icon: 'fa-solid fa-house' },
    { label: 'Mi Perfil', route: '/voluntario/perfil', icon: 'fa-solid fa-user' },
    { label: 'Historial', route: '/voluntario/historial', icon: 'fa-solid fa-clock-rotate-left' },
  ]);

  // 4. CAMBIO CLAVE: Usamos 'computed' para conectar con la señal global del servicio.
  // Esto hace que el sidebar reaccione en tiempo real a los cambios de foto/nombre.
  usuario = computed(() => {
    const datos = this.voluntarioService.perfilSignal();
    
    // Formateamos el nombre (Ej: "Juan G.")
    const inicialApellido = datos.apellidos ? datos.apellidos.charAt(0) + '.' : '';
    
    return {
      nombre: `${datos.nombre} ${inicialApellido}`,
      rol: 'Voluntario',
      foto: datos.foto || '' // Si hay foto nueva (base64), se pasa aquí
    };
  });

  handleLogout() {
    this.router.navigate(['/']);
  }
}
import { Component, signal, inject } from '@angular/core'; // <--- 1. Añadimos inject
import { RouterOutlet, Router } from '@angular/router';     // <--- 2. Añadimos Router
import { Sidebar, SidebarLink } from '../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'voluntario-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './voluntario-layout.html',
})
export class VoluntarioLayout {
  
  // 3. Inyectamos el Router para poder navegar
  private router = inject(Router);
  
  menuLinks = signal<SidebarLink[]>([
    { label: 'Inicio', route: '/voluntario/inicio', icon: 'fa-solid fa-house' },
    { label: 'Mi Perfil', route: '/voluntario/perfil', icon: 'fa-solid fa-user' },
    { label: 'Historial', route: '/voluntario/historial', icon: 'fa-solid fa-clock-rotate-left' },
  ]);

  usuario = signal({
    nombre: 'Juan G.',
    rol: 'Voluntario',
    foto: '' 
  });

  handleLogout() {
    // 4. Redirigimos a la Landing Page ('/')
    this.router.navigate(['/']);
  }
}
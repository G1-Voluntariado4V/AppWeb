import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Sidebar, SidebarLink } from '../../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'coordinador-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './coordinador-layout.html',
})
export class CoordinadorLayout {
  
  private router = inject(Router);

  // Definimos el menú basándonos en tu Figma
  menuLinks = signal<SidebarLink[]>([
    { label: 'Dashboard', route: '/coordinador/dashboard', icon: 'fa-solid fa-chart-pie' },
    { label: 'Actividades', route: '/coordinador/actividades', icon: 'fa-regular fa-calendar' },
    
    // Sección Usuarios (Simulada visualmente con iconos de grupo)
    { label: 'Organizaciones', route: '/coordinador/usuarios/organizaciones', icon: 'fa-solid fa-building' },
    { label: 'Voluntarios', route: '/coordinador/usuarios/voluntarios', icon: 'fa-solid fa-users' },
    
    // Sección Aprobaciones (Iconos de check)
    { label: 'Aprob. Organizaciones', route: '/coordinador/aprobaciones/organizaciones', icon: 'fa-solid fa-file-signature' },
    { label: 'Aprob. Voluntarios', route: '/coordinador/aprobaciones/voluntarios', icon: 'fa-solid fa-user-check' },
    { label: 'Aprob. Actividades', route: '/coordinador/aprobaciones/actividades', icon: 'fa-solid fa-calendar-check' },
  ]);

  usuario = signal({
    nombre: 'Admin',
    rol: 'Coordinador',
    foto: '' // Puedes poner una foto de admin por defecto si quieres
  });

  handleLogout() {
    this.router.navigate(['/']);
  }
}

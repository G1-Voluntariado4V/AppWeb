import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizacionService } from '../../services/organizacion.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-org',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class Dashboard {

  private orgService = inject(OrganizacionService);
  private authService = inject(AuthService);

  // Computed que garantiza foto de Google con prioridad
  perfil = computed(() => {
    const perfilBase = this.orgService.perfil();
    const googlePhoto = this.authService.getGooglePhoto();

    return {
      ...perfilBase,
      // PRIORIDAD: Google photo > Backend photo
      foto: googlePhoto || perfilBase.foto
    };
  });

  stats = this.orgService.stats;

  // Usamos la señal directa en vez del getter con observable
  actividadesRecientes = this.orgService.actividades;

  fechaHoy = signal(new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
}

import { Component, inject, computed } from '@angular/core';
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
      foto: googlePhoto || perfilBase.foto
    };
  });

  // Estadísticas desde la API
  estadisticas = this.orgService.estadisticas;

  // Actividades recientes
  actividadesRecientes = this.orgService.actividades;

  // Fecha formateada
  fechaHoy = computed(() => {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // Helper para formatear fechas
  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }
}

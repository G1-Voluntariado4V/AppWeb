import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizacionService, ActividadOrg } from '../../services/organizacion.service';
import { RouterModule } from '@angular/router'; // Para poder navegar a 'Actividades'

@Component({
  selector: 'app-dashboard-org', // Nombre selector único
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  
  private orgService = inject(OrganizacionService);

  // Datos del perfil (para el "Hola, Amavir")
  perfil = this.orgService.perfil;

  // Estadísticas calculadas en el servicio
  stats = this.orgService.stats;

  // Lista de actividades (para mostrar las últimas en el resumen)
  actividadesRecientes = this.orgService.getActividades(); 
  
  // Fecha actual para mostrar
  fechaHoy = signal(new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
}
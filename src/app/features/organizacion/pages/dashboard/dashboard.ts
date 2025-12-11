import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizacionService } from '../../services/organizacion.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-org',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  
  private orgService = inject(OrganizacionService);

  perfil = this.orgService.perfil;
  stats = this.orgService.stats;

  // CAMBIO: Usamos la señal directa en vez del getter con observable
  actividadesRecientes = this.orgService.actividades; 
  
  fechaHoy = signal(new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
}
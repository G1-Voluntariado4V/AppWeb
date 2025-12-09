import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinadorService, SolicitudOrganizacion } from '../../../services/coordinador';

@Component({
  selector: 'app-aprob-organizaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aprob-organizaciones.html',
})
export class AprobOrganizaciones implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  solicitudes = signal<SolicitudOrganizacion[]>([]);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.coordinadorService.getSolicitudesOrganizaciones().subscribe(data => {
      this.solicitudes.set(data);
    });
  }

  aprobar(id: number) {
    if(confirm('¿Aprobar esta organización? Pasará a ser un usuario activo.')) {
      this.coordinadorService.aprobarOrganizacion(id).subscribe(() => {
        this.cargarDatos(); // Recargar la lista para que desaparezca
      });
    }
  }

  rechazar(id: number) {
    if(confirm('¿Rechazar solicitud? Se eliminará permanentemente.')) {
      this.coordinadorService.rechazarOrganizacion(id).subscribe(() => {
        this.cargarDatos();
      });
    }
  }
}

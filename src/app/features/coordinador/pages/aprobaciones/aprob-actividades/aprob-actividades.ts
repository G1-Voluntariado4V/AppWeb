import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CoordinadorService, ActividadAdmin } from '../../../services/coordinador';
import { ModalDetalleActividad } from '../../../components/modal-detalle-actividad/modal-detalle-actividad';

@Component({
  selector: 'app-aprob-actividades',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalDetalleActividad],
  templateUrl: './aprob-actividades.html',
})
export class AprobActividades implements OnInit {

  private coordinadorService = inject(CoordinadorService);

  solicitudes = signal<ActividadAdmin[]>([]);
  cargando = signal(true);

  // Contadores
  countOrganizaciones = signal(0);
  countVoluntarios = signal(0);

  // Modal de detalle
  actParaVer = signal<ActividadAdmin | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);

    // Cargar actividades en revisión
    this.coordinadorService.getSolicitudesActividades().subscribe({
      next: (data) => {
        this.solicitudes.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });

    // Cargar contadores de otras secciones
    this.coordinadorService.getSolicitudesOrganizaciones().subscribe(data => {
      this.countOrganizaciones.set(data.length);
    });

    this.coordinadorService.getSolicitudesVoluntarios().subscribe(data => {
      this.countVoluntarios.set(data.length);
    });
  }

  aprobar(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Publicar esta actividad? Será visible para los voluntarios.')) {
      this.coordinadorService.aprobarActividad(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => alert('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  rechazar(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Rechazar propuesta de actividad?')) {
      this.coordinadorService.rechazarActividad(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => alert('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  verDetalle(act: ActividadAdmin) {
    this.actParaVer.set(act);
  }

  cerrarDetalle() {
    this.actParaVer.set(null);
  }

  // Helper para formatear fecha
  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  }
}
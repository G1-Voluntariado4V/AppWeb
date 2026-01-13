import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CoordinadorService, VoluntarioAdmin } from '../../../services/coordinador';
import { ModalDetalleVoluntario } from '../../../components/modal-detalle-voluntario/modal-detalle-voluntario';

@Component({
  selector: 'app-aprob-voluntarios',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalDetalleVoluntario],
  templateUrl: './aprob-voluntarios.html',
})
export class AprobVoluntarios implements OnInit {

  private coordinadorService = inject(CoordinadorService);

  solicitudes = signal<VoluntarioAdmin[]>([]);
  cargando = signal(true);

  // Contadores
  countOrganizaciones = signal(0);
  countVoluntarios = signal(0);
  countActividades = signal(0);

  // Modal de detalle
  volParaVer = signal<VoluntarioAdmin | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);

    // Cargar voluntarios pendientes
    this.coordinadorService.getSolicitudesVoluntarios().subscribe({
      next: (data) => {
        this.solicitudes.set(data);
        this.countVoluntarios.set(data.length);
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

    this.coordinadorService.getSolicitudesActividades().subscribe(data => {
      this.countActividades.set(data.length);
    });
  }

  aprobar(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Aprobar este voluntario?')) {
      this.coordinadorService.aprobarVoluntario(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => alert('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  rechazar(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Rechazar esta solicitud?')) {
      this.coordinadorService.rechazarVoluntario(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => alert('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  verDetalle(vol: VoluntarioAdmin) {
    this.volParaVer.set(vol);
  }

  cerrarDetalle() {
    this.volParaVer.set(null);
  }
}
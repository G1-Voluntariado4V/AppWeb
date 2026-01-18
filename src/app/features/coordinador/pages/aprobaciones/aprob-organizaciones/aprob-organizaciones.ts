import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CoordinadorService, OrganizacionAdmin } from '../../../services/coordinador';
import { ModalDetalleOrganizacion } from '../../../components/modal-detalle-organizacion/modal-detalle-organizacion';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-aprob-organizaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalDetalleOrganizacion],
  templateUrl: './aprob-organizaciones.html',
})
export class AprobOrganizaciones implements OnInit {

  private coordinadorService = inject(CoordinadorService);
  private toastService = inject(ToastService);

  solicitudes = signal<OrganizacionAdmin[]>([]);
  cargando = signal(true);

  // Contadores
  countVoluntarios = signal(0);
  countActividades = signal(0);

  // Modal de detalle
  orgParaVer = signal<OrganizacionAdmin | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);

    // Cargar organizaciones pendientes
    this.coordinadorService.getSolicitudesOrganizaciones().subscribe({
      next: (data) => {
        this.solicitudes.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });

    // Cargar contadores de otras secciones
    this.coordinadorService.getSolicitudesVoluntarios().subscribe(data => {
      this.countVoluntarios.set(data.length);
    });

    this.coordinadorService.getSolicitudesActividades().subscribe(data => {
      this.countActividades.set(data.length);
    });
  }

  aprobar(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Aprobar esta organización? Pasará a ser un usuario activo.')) {
      this.coordinadorService.aprobarOrganizacion(id).subscribe({
        next: () => {
          this.cargarDatos();
          this.toastService.success('Organización aprobada');
        },
        error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  rechazar(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Rechazar solicitud?')) {
      this.coordinadorService.rechazarOrganizacion(id).subscribe({
        next: () => {
          this.cargarDatos();
          this.toastService.success('Solicitud rechazada');
        },
        error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  verDetalle(org: OrganizacionAdmin) {
    this.orgParaVer.set(org);
  }

  cerrarDetalle() {
    this.orgParaVer.set(null);
  }
}

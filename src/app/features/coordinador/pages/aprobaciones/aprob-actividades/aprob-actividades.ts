import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CoordinadorService, ActividadAdmin } from '../../../services/coordinador';
import { ModalDetalleActividad } from '../../../components/modal-detalle-actividad/modal-detalle-actividad';
import { ToastService } from '../../../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-aprob-actividades',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalDetalleActividad, ConfirmModalComponent],
  templateUrl: './aprob-actividades.html',
})
export class AprobActividades implements OnInit {

  private coordinadorService = inject(CoordinadorService);
  private toastService = inject(ToastService);

  solicitudes = signal<ActividadAdmin[]>([]);
  cargando = signal(true);

  // Contadores
  countOrganizaciones = signal(0);
  countVoluntarios = signal(0);

  // Modal de detalle
  actParaVer = signal<ActividadAdmin | null>(null);

  // Modal de confirmación
  confirmModalVisible = signal(false);
  confirmModalTitle = signal('');
  confirmModalMessage = signal('');
  confirmModalButtonText = signal('Confirmar');
  confirmModalAction = signal<(() => void) | null>(null);

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
    this.showConfirmModal(
      '¿Publicar actividad?',
      'Esta actividad será visible para los voluntarios.',
      'Publicar',
      () => {
        this.coordinadorService.aprobarActividad(id).subscribe({
          next: () => {
            this.cargarDatos();
            this.toastService.success('Actividad publicada');
          },
          error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
        });
      }
    );
  }

  rechazar(id: number, event: Event) {
    event.stopPropagation();
    this.showConfirmModal(
      '¿Rechazar actividad?',
      'Esta propuesta de actividad será rechazada.',
      'Rechazar',
      () => {
        this.coordinadorService.rechazarActividad(id).subscribe({
          next: () => {
            this.cargarDatos();
            this.toastService.success('Actividad rechazada');
          },
          error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
        });
      }
    );
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

  // Modal de confirmación
  showConfirmModal(title: string, message: string, buttonText: string, action: () => void) {
    this.confirmModalTitle.set(title);
    this.confirmModalMessage.set(message);
    this.confirmModalButtonText.set(buttonText);
    this.confirmModalAction.set(action);
    this.confirmModalVisible.set(true);
  }

  onConfirmModalConfirm() {
    const action = this.confirmModalAction();
    if (action) action();
    this.confirmModalVisible.set(false);
  }

  onConfirmModalCancel() {
    this.confirmModalVisible.set(false);
  }
}

import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CoordinadorService, OrganizacionAdmin } from '../../../services/coordinador';
import { ModalDetalleOrganizacion } from '../../../components/modal-detalle-organizacion/modal-detalle-organizacion';
import { ToastService } from '../../../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-aprob-organizaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalDetalleOrganizacion, ConfirmModalComponent],
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
    this.showConfirmModal(
      '¿Aprobar organización?',
      'La organización pasará a ser un usuario activo y podrá crear actividades.',
      'Aprobar',
      () => {
        this.coordinadorService.aprobarOrganizacion(id).subscribe({
          next: () => {
            this.cargarDatos();
            this.toastService.success('Organización aprobada');
          },
          error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
        });
      }
    );
  }

  rechazar(id: number, event: Event) {
    event.stopPropagation();
    this.showConfirmModal(
      '¿Rechazar solicitud?',
      'Esta solicitud será rechazada.',
      'Rechazar',
      () => {
        this.coordinadorService.rechazarOrganizacion(id).subscribe({
          next: () => {
            this.cargarDatos();
            this.toastService.success('Solicitud rechazada');
          },
          error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
        });
      }
    );
  }

  verDetalle(org: OrganizacionAdmin) {
    this.orgParaVer.set(org);
  }

  cerrarDetalle() {
    this.orgParaVer.set(null);
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

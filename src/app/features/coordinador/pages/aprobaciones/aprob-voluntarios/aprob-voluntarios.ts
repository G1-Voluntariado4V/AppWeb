import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CoordinadorService, VoluntarioAdmin } from '../../../services/coordinador';
import { ModalDetalleVoluntario } from '../../../components/modal-detalle-voluntario/modal-detalle-voluntario';
import { ToastService } from '../../../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-aprob-voluntarios',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalDetalleVoluntario, ConfirmModalComponent],
  templateUrl: './aprob-voluntarios.html',
})
export class AprobVoluntarios implements OnInit {

  private coordinadorService = inject(CoordinadorService);
  private toastService = inject(ToastService);

  solicitudes = signal<VoluntarioAdmin[]>([]);
  cargando = signal(true);

  // Contadores
  countOrganizaciones = signal(0);
  countVoluntarios = signal(0);
  countActividades = signal(0);

  // Modal de detalle
  volParaVer = signal<VoluntarioAdmin | null>(null);

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
    this.showConfirmModal(
      '¿Aprobar voluntario?',
      'El voluntario pasará a estado activo y podrá acceder al sistema.',
      'Aprobar',
      () => {
        this.coordinadorService.aprobarVoluntario(id).subscribe({
          next: () => {
            this.cargarDatos();
            this.toastService.success('Voluntario aprobado');
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
        this.coordinadorService.rechazarVoluntario(id).subscribe({
          next: () => {
            this.cargarDatos();
            this.toastService.success('Solicitud rechazada');
          },
          error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
        });
      }
    );
  }

  verDetalle(vol: VoluntarioAdmin) {
    this.volParaVer.set(vol);
  }

  cerrarDetalle() {
    this.volParaVer.set(null);
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

import { Component, input, output, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActividadAdmin, CoordinadorService } from '../../services/coordinador';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-modal-detalle-actividad',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent],
  templateUrl: './modal-detalle-actividad.html',
})
export class ModalDetalleActividad implements OnInit {
  private coordinadorService = inject(CoordinadorService);
  private toastService = inject(ToastService);

  act = input.required<ActividadAdmin>();
  close = output<void>();
  edit = output<void>();

  inscritos = signal<any[]>([]);
  cargandoInscritos = signal(true);
  procesandoAccion = signal(false);

  // Signal para almacenar la data completa cargada del servidor
  actLoaded = signal<ActividadAdmin | null>(null);

  // Modal de confirmación
  confirmModalVisible = signal(false);
  confirmModalTitle = signal('');
  confirmModalMessage = signal('');
  confirmModalButtonText = signal('Confirmar');
  confirmModalAction = signal<(() => void) | null>(null);

  // Computed que usa la data cargada si existe, o el input inicial por defecto
  actividadDisplay = computed(() => this.actLoaded() || this.act());

  // Computed para formatear fecha (usando actividadDisplay)
  fechaFormateada = computed(() => {
    const fecha = this.actividadDisplay().fecha_inicio;
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  });

  ngOnInit() {
    this.cargarDetalleCompleto();
    this.cargarInscritos();
  }

  cargarDetalleCompleto() {
    this.coordinadorService.getActividadDetalle(this.act().id).subscribe({
      next: (data) => {

        this.actLoaded.set(data);
      },
      error: (err) => console.error('Error cargando detalle actividad', err)
    });
  }

  cargarInscritos() {
    this.cargandoInscritos.set(true);
    this.coordinadorService.getParticipantesActividad(this.act().id).subscribe({
      next: (data) => {
        this.inscritos.set(data);
        this.cargandoInscritos.set(false);
      },
      error: (err) => {
        this.cargandoInscritos.set(false);
      }
    });
  }

  getImagenActividadUrl(): string {
    const act = this.actividadDisplay();
    const url = act.imagen_actividad || (act as any).imagen;
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8000/uploads/actividades/${url}`;
  }

  getImagenOrganizacionUrl(): string {
    const url = this.actividadDisplay().img_organizacion;
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8000${url}`;
  }

  getOdsImageUrl(id: number): string {
    // Usamos el ID para obtener la imagen local mapeada en el service
    const ods = this.coordinadorService.odsList().find(o => o.id === id);
    return ods?.imgUrl || '';
  }

  // --- ACCIONES ---
  cambiarEstado(idVoluntario: number, nuevoEstado: string) {
    if (this.procesandoAccion()) return;
    this.procesandoAccion.set(true);

    this.coordinadorService.gestionarEstadoInscripcion(this.act().id, idVoluntario, nuevoEstado).subscribe({
      next: () => {
        this.toastService.success(`Inscripción ${nuevoEstado.toLowerCase()} correctamente`);
        this.cargarInscritos(); // Recargar lista
        this.procesandoAccion.set(false);
      },
      error: () => {
        this.toastService.error('Error al actualizar estado');
        this.procesandoAccion.set(false);
      }
    });
  }

  eliminarInscripcion(idVoluntario: number) {
    if (this.procesandoAccion()) return;
    
    this.showConfirmModal(
      '¿Quitar voluntario?',
      'El voluntario será eliminado de esta actividad.',
      'Quitar',
      () => {
        this.procesandoAccion.set(true);
        this.coordinadorService.eliminarInscripcion(this.act().id, idVoluntario).subscribe({
          next: () => {
            this.toastService.success('Voluntario eliminado de la actividad');
            this.cargarInscritos();
            this.procesandoAccion.set(false);
          },
          error: () => {
            this.toastService.error('Error al eliminar voluntario');
            this.procesandoAccion.set(false);
          }
        });
      }
    );
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

  // Helper para clase de estado actividad
  getEstadoClase(): string {
    const estado = this.act().estado;
    const clases: Record<string, string> = {
      'Publicada': 'bg-emerald-100 text-emerald-700',
      'En revision': 'bg-amber-100 text-amber-700',
      'Cancelada': 'bg-gray-200 text-gray-700',
      'Rechazada': 'bg-rose-100 text-rose-700'
    };
    return clases[estado] || 'bg-gray-100 text-gray-600';
  }

  // Helper para clase de estado solicitud
  getEstadoSolicitudClase(estado: string): string {
    const clases: Record<string, string> = {
      'Aceptada': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'Pendiente': 'bg-amber-50 text-amber-600 border-amber-100',
      'Rechazada': 'bg-rose-50 text-rose-600 border-rose-100',
      'Finalizada': 'bg-blue-50 text-blue-600 border-blue-100',
      'Cancelada': 'bg-gray-50 text-gray-500 border-gray-100'
    };
    return clases[estado] || 'bg-gray-50 text-gray-500 border-gray-100';
  }

  cerrar() { this.close.emit(); }
}

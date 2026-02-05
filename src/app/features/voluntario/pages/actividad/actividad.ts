import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { VoluntarioService, MiActividad } from '../../services/voluntario.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-actividad',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  templateUrl: './actividad.html',
})
export class Actividad implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private voluntarioService = inject(VoluntarioService);
  private toastService = inject(ToastService);

  // Convertido a signal para reactividad (FIX BUG-005)
  currentId = signal(0);

  // Computed para buscar la actividad en los datos cargados
  actividad = computed(() => {
    const id = this.currentId();
    if (id === 0) return null;

    // 1. Buscar en mis actividades (historial)
    const mis = this.voluntarioService.misActividades();
    const encontrada = mis.find(a => a.id_actividad === id);

    if (encontrada) return encontrada;

    // 2. Si no, buscar en las disponibles
    const disponibles = this.voluntarioService.actividadesDisponibles();
    const disponible = disponibles.find(a => a.id_actividad === id);

    if (disponible) {
      // Mapear ActividadDisponible a MiActividad para visualización unificada
      return {
        id_actividad: disponible.id_actividad,
        titulo: disponible.titulo,
        descripcion: disponible.descripcion,
        organizacion: disponible.organizacion,
        ubicacion: disponible.ubicacion,
        fecha_inicio: disponible.fecha_inicio,
        duracion_horas: disponible.duracion_horas,
        estado_solicitud: disponible.inscrito ? (disponible.estadoInscripcion || 'Pendiente') : null,
        fecha_solicitud: '',
        tipos: disponible.tipos,
        ods: disponible.ods?.map(o => ({ id: o.id, nombre: o.nombre }))
      } as MiActividad;
    }

    return null;
  });

  cargando = computed(() => this.voluntarioService.cargando());
  procesando = signal(false);

  // Modal de confirmación
  confirmModalVisible = signal(false);
  confirmModalTitle = signal('');
  confirmModalMessage = signal('');
  confirmModalButtonText = signal('Confirmar');
  confirmModalAction = signal<(() => void) | null>(null);

  baseUrl = `${environment.apiUrl}/uploads/actividades/`;

  ngOnInit() {
    const idUrl = this.route.snapshot.paramMap.get('id');
    if (idUrl) {
      this.currentId.set(parseInt(idUrl, 10));

      // Si no tenemos datos cargados, forzar carga
      if (this.voluntarioService.actividadesDisponibles().length === 0) {
        this.voluntarioService.cargarTodo();
      }
    }
  }

  puedeDesapuntarse(): boolean {
    const act = this.actividad();
    if (!act || !act.estado_solicitud) return false;
    return act.estado_solicitud === 'Pendiente' || act.estado_solicitud === 'Aceptada';
  }

  desapuntarse() {
    this.showConfirmModal(
      '¿Desapuntarse?',
      '¿Seguro que quieres desapuntarte de esta actividad?',
      'Desapuntarse',
      () => {
        this.procesando.set(true);

        this.voluntarioService.desapuntarse(this.currentId()).subscribe({
          next: (result) => {
            if (result.success) {
              this.toastService.success('Te has desapuntado correctamente.');
              setTimeout(() => this.router.navigate(['/voluntario/historial']), 1000);
            } else {
              this.toastService.error(result.mensaje);
            }
            this.procesando.set(false);
          },
          error: () => {
            this.procesando.set(false);
          }
        });
      }
    );
  }

  inscribirse() {
    this.procesando.set(true);

    this.voluntarioService.inscribirse(this.currentId()).subscribe({
      next: (result) => {
        if (result.success) {
          this.toastService.success('¡Te has inscrito correctamente!');
        } else {
          this.toastService.error(result.mensaje);
        }
        this.procesando.set(false);
      },
      error: () => {
        this.procesando.set(false);
      }
    });
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

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Aceptada': return 'bg-green-100 text-green-700';
      case 'Finalizada': return 'bg-gray-100 text-gray-700';
      case 'Pendiente': return 'bg-orange-100 text-orange-700';
      case 'Rechazada': return 'bg-red-50 text-red-600';
      case 'Cancelada': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  }
}

import { Component, input, output, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActividadAdmin, CoordinadorService } from '../../services/coordinador';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-modal-detalle-actividad',
  standalone: true,
  imports: [CommonModule],
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
        console.log('Detalle completo cargado:', data);
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
    if (!confirm('¿Estás seguro de quitar a este voluntario?')) return;

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

  // Helper para clase de estado actividad
  getEstadoClase(): string {
    const estado = this.act().estado;
    const clases: Record<string, string> = {
      'Publicada': 'bg-green-100 text-green-700',
      'En revision': 'bg-orange-100 text-orange-700',
      'Cancelada': 'bg-gray-100 text-gray-600',
      'Rechazada': 'bg-red-100 text-red-700'
    };
    return clases[estado] || 'bg-gray-100 text-gray-600';
  }

  // Helper para clase de estado solicitud
  getEstadoSolicitudClase(estado: string): string {
    const clases: Record<string, string> = {
      'Aceptada': 'bg-green-50 text-green-600 border-green-100',
      'Pendiente': 'bg-orange-50 text-orange-600 border-orange-100',
      'Rechazada': 'bg-red-50 text-red-600 border-red-100',
      'Finalizada': 'bg-blue-50 text-blue-600 border-blue-100',
      'Cancelada': 'bg-gray-50 text-gray-500 border-gray-100'
    };
    return clases[estado] || 'bg-gray-50 text-gray-500 border-gray-100';
  }

  cerrar() { this.close.emit(); }
}
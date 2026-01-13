import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActividadAdmin } from '../../services/coordinador';

@Component({
  selector: 'app-modal-detalle-actividad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-detalle-actividad.html',
})
export class ModalDetalleActividad {
  act = input.required<ActividadAdmin>();
  close = output<void>();

  // Computed para formatear fecha
  fechaFormateada = computed(() => {
    const fecha = this.act().fecha_inicio;
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

  // Helper para clase de estado
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

  cerrar() { this.close.emit(); }
}
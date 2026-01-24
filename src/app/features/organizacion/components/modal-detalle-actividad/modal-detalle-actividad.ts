import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActividadOrg, OrganizacionService } from '../../services/organizacion.service';
import { ModalVoluntariosComponent } from '../modal-voluntarios/modal-voluntarios';

@Component({
  selector: 'app-modal-detalle-actividad',
  standalone: true,
  imports: [CommonModule, ModalVoluntariosComponent],
  templateUrl: './modal-detalle-actividad.html',
})
export class ModalDetalleActividad {

  private orgService = inject(OrganizacionService);

  act = input.required<ActividadOrg>();
  close = output<void>();
  deleted = output<number>(); // Emite el ID de la actividad eliminada

  mostrarVoluntarios = signal(false);
  mostrarConfirmacion = signal(false);
  eliminando = signal(false);
  errorEliminar = signal<string | null>(null);

  getEstadoIcono(): string {
    const iconos: { [key: string]: string } = {
      'En revision': 'fa-clock',
      'Publicada': 'fa-check-circle',
      'Finalizada': 'fa-flag-checkered',
      'Rechazada': 'fa-times-circle'
    };
    return iconos[this.act().estado] || 'fa-circle';
  }

  formatearFecha(): string {
    const fecha = this.act().fecha_inicio;
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  formatearFechaCorta(): string {
    const fecha = this.act().fecha_inicio;
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
      });
    } catch {
      return fecha;
    }
  }

  calcularOcupacion(): number {
    const cupo = this.act().cupo_maximo || 1;
    const inscritos = this.act().voluntariosInscritos || 0;
    return Math.round((inscritos / cupo) * 100);
  }

  // Mostrar confirmación de eliminación
  confirmarEliminar(): void {
    this.mostrarConfirmacion.set(true);
    this.errorEliminar.set(null);
  }

  // Cancelar eliminación
  cancelarEliminar(): void {
    this.mostrarConfirmacion.set(false);
    this.errorEliminar.set(null);
  }

  // Eliminar actividad
  eliminarActividad(): void {
    if (this.eliminando()) return;

    this.eliminando.set(true);
    this.errorEliminar.set(null);

    this.orgService.eliminarActividad(this.act().id).subscribe({
      next: (result) => {
        this.eliminando.set(false);
        if (result.success) {
          this.deleted.emit(this.act().id);
          this.close.emit();
        } else {
          this.errorEliminar.set(result.mensaje);
        }
      },
      error: (err) => {
        this.eliminando.set(false);
        this.errorEliminar.set('Error al eliminar la actividad');
        console.error('Error eliminando actividad:', err);
      }
    });
  }
}
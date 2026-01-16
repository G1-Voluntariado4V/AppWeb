import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActividadOrg } from '../../services/organizacion.service';
import { ModalVoluntariosComponent } from '../modal-voluntarios/modal-voluntarios';

@Component({
  selector: 'app-modal-detalle-actividad',
  standalone: true,
  imports: [CommonModule, ModalVoluntariosComponent],
  templateUrl: './modal-detalle-actividad.html',
})
export class ModalDetalleActividad {

  act = input.required<ActividadOrg>();
  close = output<void>();
  mostrarVoluntarios = signal(false);

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

  calcularOcupacion(): number {
    const cupo = this.act().cupo_maximo || 1;
    const inscritos = this.act().voluntariosInscritos || 0;
    return Math.round((inscritos / cupo) * 100);
  }
}
import { Component, input, output } from '@angular/core';
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

  // Mock participantes
  participantes = [
    { nombre: 'Lucía Fernández', curso: '2º DAM' },
    { nombre: 'Marcos Alonso', curso: '1º SMR' }
  ];

  cerrar() { this.close.emit(); }
}
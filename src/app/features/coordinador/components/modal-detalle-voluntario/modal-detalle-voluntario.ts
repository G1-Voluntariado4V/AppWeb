import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoluntarioAdmin } from '../../services/coordinador';

@Component({
  selector: 'app-modal-detalle-voluntario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-detalle-voluntario.html',
})
export class ModalDetalleVoluntario {
  vol = input.required<VoluntarioAdmin>();
  close = output<void>();

  historial = [
    { actividad: 'Recogida de Alimentos', fecha: '12 Ene 2025', status: 'Completado', class: 'bg-green-100 text-green-700' },
    { actividad: 'Acompañamiento Digital', fecha: '10 Feb 2025', status: 'En progreso', class: 'bg-blue-100 text-blue-700' }
  ];

  cerrar() { this.close.emit(); }
}
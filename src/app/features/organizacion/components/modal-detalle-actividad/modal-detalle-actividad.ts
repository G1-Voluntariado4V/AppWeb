import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActividadOrg } from '../../services/organizacion.service';

@Component({
  selector: 'app-modal-detalle-actividad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-detalle-actividad.html',
})
export class ModalDetalleActividad {
  act = input.required<ActividadOrg>();
  close = output<void>();
}

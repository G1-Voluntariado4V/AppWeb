import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizacionAdmin } from '../../services/coordinador';

@Component({
  selector: 'app-modal-detalle-organizacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-detalle-organizacion.html',
})
export class ModalDetalleOrganizacion {
  org = input.required<OrganizacionAdmin>();
  close = output<void>();

  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      'Activa': 'bg-green-100 text-green-700',
      'Pendiente': 'bg-orange-100 text-orange-700',
      'Bloqueada': 'bg-red-100 text-red-700',
      'Rechazada': 'bg-gray-100 text-gray-600'
    };
    return clases[estado] || 'bg-gray-100 text-gray-600';
  }

  cerrar() {
    this.close.emit();
  }
}
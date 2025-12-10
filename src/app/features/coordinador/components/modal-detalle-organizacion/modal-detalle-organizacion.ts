import { Component, input, output, signal } from '@angular/core';
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

  // Mock de actividades internas de esta org (para visualización)
  actividadesRecientes = [
    { nombre: 'Acompañamiento Tarde', fecha: '01 Jun 2025', voluntarios: '12/20', estado: 'Activo' },
    { nombre: 'Taller de Lectura', fecha: '15 Jun 2025', voluntarios: '5/10', estado: 'Activo' }
  ];

  cerrar() {
    this.close.emit();
  }
}
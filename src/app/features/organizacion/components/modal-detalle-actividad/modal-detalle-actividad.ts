import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importante para ngModel
import { ActividadOrg, OrganizacionService } from '../../services/organizacion.service';

@Component({
  selector: 'app-modal-detalle-actividad',
  standalone: true,
  imports: [CommonModule, FormsModule], // Añadimos FormsModule
  templateUrl: './modal-detalle-actividad.html',
})
export class ModalDetalleActividad implements OnInit {
  
  private orgService = inject(OrganizacionService);

  act = input.required<ActividadOrg>();
  close = output<void>();

  // Control del modo edición
  isEditing = signal(false);

  // Copia local para editar sin romper nada visualmente hasta guardar
  datosEditables: any = {};

  ngOnInit() {
    // Inicializamos la copia con los datos originales
    this.datosEditables = { ...this.act() };
  }

  // Activa el modo edición
  activarEdicion() {
    this.isEditing.set(true);
  }

  // Guarda los cambios en el servicio
  guardarCambios() {
    this.orgService.actualizarActividad(this.datosEditables);
    this.isEditing.set(false);
    this.close.emit(); // Cerramos modal (o podrías dejarlo abierto para ver cambios)
    alert('Actividad actualizada correctamente');
  }

  // Cancela la edición y restaura datos
  cancelarEdicion() {
    this.datosEditables = { ...this.act() }; // Reset
    this.isEditing.set(false);
  }

  // Elimina la actividad
  eliminar() {
    if(confirm('¿Estás seguro de que quieres cancelar y eliminar esta actividad?')) {
      this.orgService.eliminarActividad(this.act().id);
      this.close.emit();
    }
  }
}
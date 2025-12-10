import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-crear-actividad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-crear-actividad.html',
})
export class ModalCrearActividad {
  close = output<void>();
  save = output<any>();

  // Datos formulario
  nombre = signal('');
  descripcion = signal('');
  fecha = signal('');
  tipoVoluntariado = signal('Presencial');
  // ODS simulados
  odsSeleccionados = signal<number[]>([]);
  odsOptions = [
    { id: 1, nombre: 'Fin Pobreza', color: 'bg-red-500' },
    { id: 3, nombre: 'Salud', color: 'bg-green-500' },
    { id: 4, nombre: 'Educación', color: 'bg-red-400' },
    { id: 10, nombre: 'Reducción', color: 'bg-pink-600' }
  ];

  toggleOds(id: number) {
    this.odsSeleccionados.update(l => l.includes(id) ? l.filter(x => x !== id) : [...l, id]);
  }

  guardar() {
    if(!this.nombre() || !this.fecha()) return alert('Rellena nombre y fecha');
    this.save.emit({
      nombre: this.nombre(),
      descripcion: this.descripcion(),
      fecha: this.fecha(),
      tipoVoluntariado: this.tipoVoluntariado(),
      ods: this.odsSeleccionados()
    });
    this.close.emit();
  }
}

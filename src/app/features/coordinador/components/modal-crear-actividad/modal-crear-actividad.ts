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

  // Campos
  nombre = signal('');
  tipo = signal('Social');
  organizador = signal('');
  fecha = signal('');
  
  // Nuevos campos SQL
  duracion = signal<number | null>(null);
  cupo = signal<number | null>(null);
  ubicacion = signal('');
  descripcion = signal('');

  error = signal('');

  cerrar() {
    this.close.emit();
  }

  guardar() {
    this.error.set('');

    // 1. Campos obligatorios
    if (!this.nombre() || !this.fecha() || !this.organizador()) {
      this.error.set('Nombre, Fecha y Organizador son obligatorios.');
      return;
    }

    // 2. Validación de Fecha (No permitir pasado)
    const fechaSeleccionada = new Date(this.fecha());
    const hoy = new Date();
    hoy.setHours(0,0,0,0); // Ignorar hora actual para comparar solo días
    
    if (fechaSeleccionada < hoy) {
      this.error.set('La fecha no puede ser anterior a hoy.');
      return;
    }

    // 3. Validaciones Numéricas (SQL INT)
    if (this.duracion() !== null && this.duracion()! <= 0) {
      this.error.set('La duración debe ser mayor a 0 horas.');
      return;
    }

    if (this.cupo() !== null && this.cupo()! <= 0) {
      this.error.set('El cupo máximo debe ser al menos 1 persona.');
      return;
    }

    // Emitir
    this.save.emit({
      nombre: this.nombre(),
      tipo: this.tipo(),
      organizador: this.organizador(),
      fecha: this.fecha(),
      duracionHoras: this.duracion(),
      cupoMaximo: this.cupo(),
      ubicacion: this.ubicacion(),
      descripcion: this.descripcion()
    });
    
    this.cerrar();
  }
}
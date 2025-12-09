import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-crear-organizacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-crear-organizacion.html',
})
export class ModalCrearOrganizacion {
  
  close = output<void>();
  save = output<any>();

  // Campos del formulario
  nombre = signal('');
  cif = signal('');       // Nuevo
  tipo = signal('ONG');
  contacto = signal('');
  email = signal('');
  telefono = signal('');  // Nuevo
  web = signal('');       // Nuevo
  direccion = signal(''); // Nuevo

  // Para mostrar errores
  error = signal('');

  cerrar() {
    this.close.emit();
  }

  guardar() {
    this.error.set(''); // Limpiar errores previos

    // 1. Validación de campos obligatorios básicos
    if (!this.nombre() || !this.email() || !this.cif()) {
      this.error.set('Nombre, Email y CIF son obligatorios.');
      return;
    }

    // 2. Validación de SQL: Teléfono (Solo números y +)
    // Regex: ^[0-9+]+$ significa "Empieza y acaba solo con dígitos o el signo más"
    const telefonoRegex = /^[0-9+]+$/;
    if (this.telefono() && !telefonoRegex.test(this.telefono())) {
      this.error.set('El teléfono solo puede contener números y el símbolo "+".');
      return;
    }

    // 3. Validación de Email simple
    if (!this.email().includes('@')) {
      this.error.set('Introduce un email válido.');
      return;
    }

    // Si todo está bien, emitimos
    this.save.emit({
      nombre: this.nombre(),
      cif: this.cif(),
      tipo: this.tipo(),
      contacto: this.contacto(),
      email: this.email(),
      telefono: this.telefono(),
      sitioWeb: this.web(),
      direccion: this.direccion()
    });
    
    this.cerrar();
  }
}
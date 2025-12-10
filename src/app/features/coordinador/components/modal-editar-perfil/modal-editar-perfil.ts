import { Component, output, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-editar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-editar-perfil.html',
})
export class ModalEditarPerfil {
  
  // Recibimos los datos actuales del usuario
  usuarioActual = input.required<any>();

  close = output<void>();
  save = output<any>();

  // Signals para el formulario
  nombre = signal('');
  email = signal('');
  cargo = signal('');
  telefono = signal('');

  // Al iniciar, rellenamos el formulario con los datos actuales
  ngOnInit() {
    this.nombre.set(this.usuarioActual().nombre);
    this.email.set(this.usuarioActual().email);
    this.cargo.set(this.usuarioActual().cargo);
    this.telefono.set(this.usuarioActual().telefono);
  }

  cerrar() {
    this.close.emit();
  }

  guardar() {
    this.save.emit({
      nombre: this.nombre(),
      email: this.email(),
      cargo: this.cargo(),
      telefono: this.telefono()
    });
    this.cerrar();
  }
}

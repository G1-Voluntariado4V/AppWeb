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
  
  // Signal para la previsualización de la imagen (Base64)
  imagenPreview = signal<string | null>(null);

  // Al iniciar, rellenamos el formulario con los datos actuales
  ngOnInit() {
    this.nombre.set(this.usuarioActual().nombre);
    this.email.set(this.usuarioActual().email);
    this.cargo.set(this.usuarioActual().cargo);
    this.telefono.set(this.usuarioActual().telefono);
    
    // Si el usuario ya tenía foto, la cargamos (asumiendo que viene en el objeto)
    if (this.usuarioActual().foto) {
        this.imagenPreview.set(this.usuarioActual().foto);
    }
  }

  // Método para manejar la selección de archivo
  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  cerrar() {
    this.close.emit();
  }

  guardar() {
    this.save.emit({
      nombre: this.nombre(),
      email: this.email(),
      cargo: this.cargo(),
      telefono: this.telefono(),
      foto: this.imagenPreview() // Enviamos la nueva foto
    });
    this.cerrar();
  }
}

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

  // Datos
  titulo = signal('');
  descripcion = signal('');
  tipoVoluntariado = signal('Presencial');
  fecha = signal(new Date().toISOString().split('T')[0]);
  imagenNombre = signal(''); // Para mostrar el nombre del archivo seleccionado
  
  odsSeleccionados = signal<number[]>([]);
  
  // Lista ODS
  odsOptions = [
    { id: 1, nombre: 'Fin de la Pobreza', color: 'bg-red-500', icon: 'fa-solid fa-users' },
    { id: 3, nombre: 'Salud y Bienestar', color: 'bg-green-500', icon: 'fa-solid fa-heart-pulse' },
    { id: 4, nombre: 'Educación de Calidad', color: 'bg-red-400', icon: 'fa-solid fa-book-open' },
  ];

  toggleOds(id: number) {
    this.odsSeleccionados.update(lista => {
      if (lista.includes(id)) return lista.filter(x => x !== id);
      return [...lista, id];
    });
  }

  // MÉTODO PARA GESTIONAR EL ARCHIVO
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenNombre.set(file.name);
      // Aquí podrías leer el archivo con FileReader si quisieras mostrar preview
    }
  }

  cerrar() {
    this.close.emit();
  }

  guardar() {
    if (!this.titulo() || !this.fecha()) {
      alert('El título y la fecha son obligatorios');
      return;
    }

    this.save.emit({
      nombre: this.titulo(),
      tipo: 'Social', 
      organizador: 'Interna', 
      fecha: this.fecha(),
      descripcion: this.descripcion(),
      estado: 'Active',
      ods: this.odsSeleccionados(),
      tipoVoluntariado: this.tipoVoluntariado(),
      imagen: this.imagenNombre() // Enviamos el nombre de la imagen
    });
    this.cerrar();
  }
}
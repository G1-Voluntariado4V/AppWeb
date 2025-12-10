import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService } from '../../services/organizacion.service';

@Component({
  selector: 'app-perfil-org',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
})
export class Perfil {
  
  private orgService = inject(OrganizacionService);

  // Leemos los datos actuales del servicio
  perfilActual = this.orgService.perfil;

  // Signals para el formulario local (para no editar el servicio directamente hasta guardar)
  nombre = signal('');
  email = signal('');
  telefono = signal('');
  descripcion = signal('');
  web = signal('');
  
  // Foto
  fotoPreview = signal<string | null>(null);

  constructor() {
    // Usamos un effect para cargar los datos cuando el servicio esté listo
    // o simplemente en el constructor si ya están disponibles.
    // Al ser signals, podemos leer el valor actual directamente.
    const datos = this.perfilActual();
    this.nombre.set(datos.nombre);
    this.email.set(datos.email);
    this.telefono.set(datos.telefono);
    this.descripcion.set(datos.descripcion);
    this.web.set(datos.web);
    this.fotoPreview.set(datos.foto);
  }

  // Selección de foto
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.fotoPreview.set(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  guardar() {
    // Actualizamos el servicio
    this.orgService.actualizarPerfil({
      nombre: this.nombre(),
      email: this.email(),
      telefono: this.telefono(),
      descripcion: this.descripcion(),
      web: this.web(),
      foto: this.fotoPreview()
    });

    alert('Perfil actualizado correctamente');
  }
}
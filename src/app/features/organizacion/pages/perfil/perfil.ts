import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService } from '../../services/organizacion.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-perfil-org',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
})
export class Perfil {
  
  private orgService = inject(OrganizacionService);
  private authService = inject(AuthService);

  // Leemos los datos actuales del servicio
  perfilActual = this.orgService.perfil;

  // Signals para el formulario local (para no editar el servicio directamente hasta guardar)
  nombre = signal('');
  email = signal('');
  telefono = signal('');
  descripcion = signal('');
  web = signal('');
  
  // Foto - Computed para mostrar foto de Google con prioridad
  fotoPreview = signal<string | null>(null);
  
  fotoMostrar = computed(() => {
    const googlePhoto = this.authService.getGooglePhoto();
    return googlePhoto || this.fotoPreview();
  });

  constructor() {
    // Cargar los datos actuales del perfil
    const datos = this.perfilActual();
    this.nombre.set(datos.nombre);
    this.email.set(datos.email);
    this.telefono.set(datos.telefono);
    this.descripcion.set(datos.descripcion);
    this.web.set(datos.web);
    this.fotoPreview.set(datos.foto);
  }

  // Selección de foto (solo se usa si no hay foto de Google)
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
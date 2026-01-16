import { Component, inject, signal, computed, effect } from '@angular/core';
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

  // Foto de Google (reactiva)
  fotoGoogle = computed(() => this.authService.userProfile().foto);

  // Signals para el formulario local (para no editar el servicio directamente hasta guardar)
  nombre = signal('');
  email = signal('');
  telefono = signal('');
  descripcion = signal('');
  web = signal('');
  cif = signal('');
  direccion = signal('');

  // Iniciales para avatar fallback
  iniciales = computed(() => {
    const n = this.nombre();
    if (!n) return 'O';
    return n.charAt(0).toUpperCase();
  });

  constructor() {
    // Cargar los datos cuando el perfil esté disponible
    effect(() => {
      const datos = this.orgService.perfil();
      if (datos.nombre) {
        this.nombre.set(datos.nombre);
        this.email.set(datos.email);
        this.telefono.set(datos.telefono);
        this.descripcion.set(datos.descripcion);
        this.web.set(datos.web);
        this.cif.set(datos.cif || '');
        this.direccion.set(datos.direccion || '');
      }
    });
  }

  guardar() {
    // Actualizamos el servicio
    this.orgService.actualizarPerfil({
      nombre: this.nombre(),
      email: this.email(),
      telefono: this.telefono(),
      descripcion: this.descripcion(),
      web: this.web(),
      cif: this.cif(),
      direccion: this.direccion()
    });

    alert('Perfil actualizado correctamente');
  }
}

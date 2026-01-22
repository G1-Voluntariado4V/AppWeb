import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService } from '../../services/organizacion.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-perfil-org',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
})
export class Perfil {

  private orgService = inject(OrganizacionService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Estado de guardando
  guardando = signal(false);

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
    // Validación del frontend antes de enviar
    const nombreActual = this.nombre().trim();
    const descripcionActual = this.descripcion().trim();

    if (!nombreActual) {
      this.toastService.error('El nombre de la organización es obligatorio');
      return;
    }

    if (!descripcionActual) {
      this.toastService.error('La descripción de la organización es obligatoria');
      return;
    }

    this.guardando.set(true);

    // Actualizamos el servicio - ahora retorna Observable y persiste en backend
    this.orgService.actualizarPerfil({
      nombre: nombreActual,
      email: this.email(),
      telefono: this.telefono().trim(),
      descripcion: descripcionActual,
      web: this.web().trim(),
      cif: this.cif(),
      direccion: this.direccion().trim()
    }).subscribe({
      next: (result) => {
        this.guardando.set(false);
        if (result.success) {
          this.toastService.success(result.mensaje);
        } else {
          this.toastService.error(result.mensaje);
        }
      },
      error: () => {
        this.guardando.set(false);
        this.toastService.error('Error al guardar los cambios');
      }
    });
  }
}


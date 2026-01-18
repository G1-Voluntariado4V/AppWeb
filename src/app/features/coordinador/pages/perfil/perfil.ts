import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, PerfilCoordinadorUI } from '../../services/coordinador';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Perfil implements OnInit {
  private coordinadorService = inject(CoordinadorService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Estado de edición
  modoEdicion = signal(false);
  guardando = signal(false);

  // Datos editables
  nombreEditable = signal('');
  apellidosEditable = signal('');
  telefonoEditable = signal('');

  // Computed que garantiza foto de Google con prioridad
  perfil = computed(() => {
    const perfilBase = this.coordinadorService.perfilUsuario();
    const googlePhoto = this.authService.getGooglePhoto();

    return {
      ...perfilBase,
      foto: googlePhoto || perfilBase.foto
    };
  });

  inicial = computed(() => (this.perfil().nombre || 'U').charAt(0).toUpperCase());
  rol = computed(() => this.perfil().cargo || 'Coordinador');

  ngOnInit() {
    this.coordinadorService.sincronizarPerfil();
    this.cargarDatosEditables();
  }

  cargarDatosEditables() {
    const p = this.perfil();
    // Extraer nombre y apellidos del nombre completo si están juntos
    const partes = (p.nombre || '').split(' ');
    if (p.apellidos) {
      this.nombreEditable.set(p.nombre || '');
      this.apellidosEditable.set(p.apellidos || '');
    } else if (partes.length > 1) {
      this.nombreEditable.set(partes[0]);
      this.apellidosEditable.set(partes.slice(1).join(' '));
    } else {
      this.nombreEditable.set(p.nombre || '');
      this.apellidosEditable.set('');
    }
    this.telefonoEditable.set(p.telefono || '');
  }

  activarEdicion() {
    this.cargarDatosEditables();
    this.modoEdicion.set(true);
  }

  cancelarEdicion() {
    this.cargarDatosEditables();
    this.modoEdicion.set(false);
  }

  guardarCambios() {
    const id = this.perfil().id_usuario;
    if (!id) {
      this.toastService.error('No se pudo identificar el usuario');
      return;
    }

    this.guardando.set(true);

    this.coordinadorService.actualizarPerfilEnBackend(id, {
      nombre: this.nombreEditable(),
      apellidos: this.apellidosEditable(),
      telefono: this.telefonoEditable()
    }).subscribe({
      next: () => {
        this.modoEdicion.set(false);
        this.guardando.set(false);
        this.toastService.success('Perfil actualizado correctamente');
      },
      error: (err: any) => {
        this.guardando.set(false);
        this.toastService.error('Error al actualizar: ' + (err.error?.error || 'Error desconocido'));
      }
    });
  }
}


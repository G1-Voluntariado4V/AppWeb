import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, effect } from '@angular/core';
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

  // Flag para saber si ya se cargaron los datos iniciales
  private datosInicializados = false;

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
  nombreCompleto = computed(() => [this.perfil().nombre, this.perfil().apellidos].filter(Boolean).join(' '));

  constructor() {
    // Effect para actualizar los campos editables cuando el perfil cambia del backend
    // Esto es clave: espera a que llegue la respuesta del backend antes de inicializar los campos
    effect(() => {
      const p = this.perfil();

      // Solo actualizar si hay datos del perfil y no estamos en modo edición
      // Esto evita sobrescribir los campos mientras el usuario está editando
      if (p.id_usuario && !this.modoEdicion()) {
        this.actualizarCamposEditables(p);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // Forzar sincronización con el backend al entrar a la página
    this.coordinadorService.sincronizarPerfil();
  }

  private actualizarCamposEditables(p: PerfilCoordinadorUI & { foto: string | null }) {
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
    // Cargar datos actuales antes de editar
    this.actualizarCamposEditables(this.perfil());
    this.modoEdicion.set(true);
  }

  cancelarEdicion() {
    this.actualizarCamposEditables(this.perfil());
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

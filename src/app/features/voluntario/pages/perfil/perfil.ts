import { Component, signal, inject, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VoluntarioService, PerfilVoluntario } from '../../services/voluntario.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {

  private voluntarioService = inject(VoluntarioService);
  private authService = inject(AuthService);

  // Estado
  cargando = computed(() => this.voluntarioService.cargando());
  guardando = signal(false);
  mensaje = signal<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  editando = signal(false);

  // Perfil original (del backend)
  perfilOriginal = computed(() => this.voluntarioService.perfil());

  // Perfil editable (copia local)
  perfilEditable = signal<Partial<PerfilVoluntario>>({});

  // Foto (siempre de Google si está disponible)
  foto = computed(() => {
    const googlePhoto = this.authService.getGooglePhoto();
    return googlePhoto || this.perfilOriginal()?.foto || '';
  });

  // Email (de Google)
  email = computed(() => {
    const googleEmail = this.authService.getGoogleEmail();
    return googleEmail || this.perfilOriginal()?.email || '';
  });

  // Estadísticas
  estadisticas = computed(() => this.voluntarioService.estadisticas());

  constructor() {
    // Usar effect() para reaccionar a cambios en perfilOriginal
    // Esto corrige el bug donde perfilEditable quedaba vacío si los datos llegaban después de ngOnInit
    effect(() => {
      const perfil = this.perfilOriginal();
      if (perfil && Object.keys(this.perfilEditable()).length === 0) {
        this.perfilEditable.set({ ...perfil });
      }
    });
  }

  ngOnInit() {
    // Cargar datos si no hay
    if (!this.perfilOriginal()) {
      this.voluntarioService.cargarTodo();
    }
  }

  iniciarEdicion() {
    const perfil = this.perfilOriginal();
    if (perfil) {
      this.perfilEditable.set({ ...perfil });
    }
    this.editando.set(true);
    this.mensaje.set(null);
  }

  cancelarEdicion() {
    this.editando.set(false);
    this.mensaje.set(null);
    // Restaurar valores originales
    const perfil = this.perfilOriginal();
    if (perfil) {
      this.perfilEditable.set({ ...perfil });
    }
  }

  guardarCambios() {
    this.guardando.set(true);
    this.mensaje.set(null);

    this.voluntarioService.actualizarPerfil(this.perfilEditable()).subscribe({
      next: (result) => {
        if (result.success) {
          this.mensaje.set({ tipo: 'success', texto: '¡Perfil actualizado correctamente!' });
          this.editando.set(false);
        } else {
          this.mensaje.set({ tipo: 'error', texto: result.mensaje });
        }
        this.guardando.set(false);
      },
      error: () => {
        this.mensaje.set({ tipo: 'error', texto: 'Error al guardar los cambios.' });
        this.guardando.set(false);
      }
    });
  }

  updateField(field: string, value: any) {
    this.perfilEditable.update(p => ({ ...p, [field]: value }));
  }

  getNivelClass(nivel: string): string {
    switch (nivel) {
      case 'Experto': return 'bg-purple-100 text-purple-700';
      case 'Intermedio': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}


import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinadorService, DashboardStats, Aviso } from '../../services/coordinador';
import { ModalEditarPerfil } from '../../components/modal-editar-perfil/modal-editar-perfil';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, ModalEditarPerfil],
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit {

  private coordinadorService = inject(CoordinadorService);
  private authService = inject(AuthService);

  stats = signal<DashboardStats>({
    voluntariosActivos: 0,
    organizacionesActivas: 0,
    horasTotales: 0,
    actividadesTotales: 0
  });

  avisos = signal<Aviso[]>([]);
  anioActual = signal('2025/2026');

  // --- DATOS DEL PERFIL ---
  // Computed que garantiza foto de Google con prioridad
  perfil = computed(() => {
    const perfilBase = this.coordinadorService.perfilUsuario();
    const googlePhoto = this.authService.getGooglePhoto();

    return {
      ...perfilBase,
      // PRIORIDAD: Google photo > Backend photo
      foto: googlePhoto || perfilBase.foto
    };
  });

  // Control del modal
  modalPerfilVisible = signal(false);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.coordinadorService.getDashboardStats().subscribe(data => this.stats.set(data));
    this.coordinadorService.getAvisos().subscribe(data => this.avisos.set(data));
  }

  // Métodos del Modal
  abrirModalPerfil() {
    this.modalPerfilVisible.set(true);
  }

  cerrarModalPerfil() {
    this.modalPerfilVisible.set(false);
  }

  actualizarPerfil(nuevosDatos: any) {
    // Llamamos al método del servicio para actualizar el estado global
    this.coordinadorService.actualizarPerfilUsuario(nuevosDatos);
  }
}

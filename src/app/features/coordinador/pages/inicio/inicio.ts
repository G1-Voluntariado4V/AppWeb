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
    actividadesTotales: 0,
    usuariosPendientes: 0
  });

  avisos = signal<Aviso[]>([]);
  anioActual = signal(this.getAnioAcademico());
  cargando = signal(true);

  // --- DATOS DEL PERFIL ---
  perfil = computed(() => this.coordinadorService.perfilUsuario());

  modalPerfilVisible = signal(false);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);

    this.coordinadorService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });

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
    this.coordinadorService.actualizarPerfilUsuario(nuevosDatos);
  }

  private getAnioAcademico(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Si estamos después de agosto, el año académico es year/year+1
    if (month >= 8) {
      return `${year}/${year + 1}`;
    }
    return `${year - 1}/${year}`;
  }
}

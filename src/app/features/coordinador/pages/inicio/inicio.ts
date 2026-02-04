import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CoordinadorService, DashboardStats, Aviso } from '../../services/coordinador';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit {

  private coordinadorService = inject(CoordinadorService);
  private authService = inject(AuthService);
  private router = inject(Router);

  stats = signal<DashboardStats>({
    voluntariosActivos: 0,
    organizacionesActivas: 0,
    actividadesTotales: 0,
    usuariosPendientes: 0
  });

  avisos = signal<Aviso[]>([]);
  anioActual = signal(this.getAnioAcademico());
  cargando = signal(true);
  cargandoAvisos = signal(true);

  // --- DATOS DEL PERFIL ---
  perfil = computed(() => this.coordinadorService.perfilUsuario());

  // Fecha actual formateada
  fechaHoy = computed(() => {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);
    this.cargandoAvisos.set(true);

    // Al llamar a getAvisos, este ya llama internamente a getDashboardStats
    // Por lo que podemos obtener ambos casi al mismo tiempo o dispararlos en paralelo
    this.coordinadorService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });

    this.coordinadorService.getAvisos().subscribe({
      next: (data) => {
        this.avisos.set(data);
        this.cargandoAvisos.set(false);
      },
      error: () => this.cargandoAvisos.set(false)
    });
  }

  // Navegar al hacer click en un aviso
  navegarAviso(aviso: Aviso) {
    if (aviso.ruta) {
      this.router.navigate([aviso.ruta]);
    }
  }

  // Navegar a Mi Perfil
  irAPerfil() {
    this.router.navigate(['/coordinador/perfil']);
  }

  // Accesos rápidos
  irAVoluntarios() {
    this.router.navigate(['/coordinador/usuarios/voluntarios']);
  }

  irAOrganizaciones() {
    this.router.navigate(['/coordinador/usuarios/organizaciones']);
  }

  irAActividades() {
    this.router.navigate(['/coordinador/actividades']);
  }

  irAAprobaciones() {
    this.router.navigate(['/coordinador/aprobaciones/voluntarios']);
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

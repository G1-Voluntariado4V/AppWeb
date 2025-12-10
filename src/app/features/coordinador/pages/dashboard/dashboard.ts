import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinadorService, DashboardStats, Aviso } from '../../services/coordinador';
import { ModalEditarPerfil } from '../../components/modal-editar-perfil/modal-editar-perfil';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ModalEditarPerfil],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  stats = signal<DashboardStats>({
    voluntariosActivos: 0,
    organizacionesActivas: 0,
    horasTotales: 0,
    actividadesTotales: 0
  });

  avisos = signal<Aviso[]>([]);
  anioActual = signal('2025/2026');

  // --- DATOS DEL PERFIL ---
  // CAMBIO IMPORTANTE: Enlazamos directamente con la señal del servicio.
  // Así, cuando cambie aquí, cambiará en el Sidebar automáticamente.
  perfil = this.coordinadorService.perfilUsuario;

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
    // CAMBIO IMPORTANTE: Llamamos al método del servicio para actualizar el estado global.
    this.coordinadorService.actualizarPerfilUsuario(nuevosDatos);
    
    // (Opcional) Un alert o notificación
    // alert('Perfil actualizado correctamente');
  }
}
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinadorService, DashboardStats, Aviso } from '../../services/coordinador';
// Importamos el nuevo modal
import { ModalEditarPerfil } from '../../components/modal-editar-perfil/modal-editar-perfil';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ModalEditarPerfil], // Añadimos el modal a imports
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

  // --- NUEVO: DATOS DEL PERFIL ---
  perfil = signal({
    nombre: 'Admin General',
    cargo: 'Coordinador Principal',
    email: 'admin@cuatrovientos.org',
    telefono: '+34 600 123 456'
  });

  // Control del modal
  modalPerfilVisible = signal(false);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.coordinadorService.getDashboardStats().subscribe(data => this.stats.set(data));
    this.coordinadorService.getAvisos().subscribe(data => this.avisos.set(data));
    // Ya no cargamos la gráfica porque la vamos a quitar
  }

  // Métodos del Modal
  abrirModalPerfil() {
    this.modalPerfilVisible.set(true);
  }

  cerrarModalPerfil() {
    this.modalPerfilVisible.set(false);
  }

  actualizarPerfil(nuevosDatos: any) {
    this.perfil.set(nuevosDatos);
    // Aquí llamarías al servicio para guardar en BD si fuera real
    alert('Perfil actualizado correctamente');
  }
}
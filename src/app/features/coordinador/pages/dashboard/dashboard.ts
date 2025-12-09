import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// CORRECCIÓN 1: Importamos 'Coordinador' en lugar de 'CoordinadorService'
import { CoordinadorService, DashboardStats, ActividadSemanal, Aviso } from '../../services/coordinador';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  
  // CORRECCIÓN 2: Inyectamos la clase 'Coordinador'
  private coordinador = inject(CoordinadorService);

  // Signals para los datos
  stats = signal<DashboardStats>({
    voluntariosActivos: 0,
    incrementoMensual: 0,
    horasTotales: 0,
    voluntariadosCompletados: 0
  });

  grafica = signal<ActividadSemanal[]>([]);
  avisos = signal<Aviso[]>([]);

  // Fecha actual para el selector (visual)
  anioActual = signal('2025/2026');

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // CORRECCIÓN 3: Usamos 'this.coordinador' para llamar a los métodos
    this.coordinador.getDashboardStats().subscribe(data => this.stats.set(data));
    this.coordinador.getActividadSemanal().subscribe(data => this.grafica.set(data));
    this.coordinador.getAvisos().subscribe(data => this.avisos.set(data));
  }
}
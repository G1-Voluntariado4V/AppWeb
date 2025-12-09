import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinadorService, SolicitudActividad } from '../../../services/coordinador';

@Component({
  selector: 'app-aprob-actividades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aprob-actividades.html',
})
export class AprobActividades implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  solicitudes = signal<SolicitudActividad[]>([]);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.coordinadorService.getSolicitudesActividades().subscribe(data => {
      this.solicitudes.set(data);
    });
  }

  aprobar(id: number) {
    if(confirm('¿Publicar esta actividad? Será visible para los voluntarios.')) {
      this.coordinadorService.aprobarActividad(id).subscribe(() => this.cargarDatos());
    }
  }

  rechazar(id: number) {
    if(confirm('¿Rechazar propuesta de actividad?')) {
      this.coordinadorService.rechazarActividad(id).subscribe(() => this.cargarDatos());
    }
  }
}

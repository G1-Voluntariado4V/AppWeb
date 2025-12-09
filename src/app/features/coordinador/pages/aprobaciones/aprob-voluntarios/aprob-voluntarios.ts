import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinadorService, SolicitudVoluntario } from '../../../services/coordinador';

@Component({
  selector: 'app-aprob-voluntarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aprob-voluntarios.html',
})
export class AprobVoluntarios implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  solicitudes = signal<SolicitudVoluntario[]>([]);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.coordinadorService.getSolicitudesVoluntarios().subscribe(data => {
      this.solicitudes.set(data);
    });
  }

  aprobar(id: number) {
    if(confirm('¿Aprobar voluntario?')) {
      this.coordinadorService.aprobarVoluntario(id).subscribe(() => this.cargarDatos());
    }
  }

  rechazar(id: number) {
    if(confirm('¿Rechazar solicitud?')) {
      this.coordinadorService.rechazarVoluntario(id).subscribe(() => this.cargarDatos());
    }
  }
}
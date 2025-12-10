import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importamos VoluntarioAdmin para el tipado del modal
import { CoordinadorService, SolicitudVoluntario, VoluntarioAdmin } from '../../../services/coordinador';
// Importamos el Modal de Detalle
import { ModalDetalleVoluntario } from '../../../components/modal-detalle-voluntario/modal-detalle-voluntario';

@Component({
  selector: 'app-aprob-voluntarios',
  standalone: true,
  imports: [CommonModule, ModalDetalleVoluntario],
  templateUrl: './aprob-voluntarios.html',
})
export class AprobVoluntarios implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  solicitudes = signal<SolicitudVoluntario[]>([]);
  
  // Signal para controlar el modal de detalle (Tipo VoluntarioAdmin)
  volParaVer = signal<VoluntarioAdmin | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.coordinadorService.getSolicitudesVoluntarios().subscribe(data => {
      this.solicitudes.set(data);
    });
  }

  // Añadimos 'event' para detener la propagación del click
  aprobar(id: number, event: Event) {
    event.stopPropagation();
    if(confirm('¿Aprobar voluntario?')) {
      this.coordinadorService.aprobarVoluntario(id).subscribe(() => this.cargarDatos());
    }
  }

  rechazar(id: number, event: Event) {
    event.stopPropagation();
    if(confirm('¿Rechazar solicitud?')) {
      this.coordinadorService.rechazarVoluntario(id).subscribe(() => this.cargarDatos());
    }
  }

  // --- LÓGICA DE DETALLE ---
  verDetalle(solicitud: SolicitudVoluntario) {
    // Convertimos la Solicitud (datos escasos) en VoluntarioAdmin (datos completos)
    // Rellenamos lo que falta con datos por defecto
    const volTemp: VoluntarioAdmin = {
      id: solicitud.id,
      nombre: solicitud.nombre,
      email: solicitud.email,
      curso: solicitud.curso,
      actividadesCount: 0, // Nuevo voluntario empieza en 0
      estado: 'Pendiente' // Estado visual para el modal
    };
    
    this.volParaVer.set(volTemp);
  }

  cerrarDetalle() {
    this.volParaVer.set(null);
  }
}
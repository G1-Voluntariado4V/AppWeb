import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Necesario para routerLink
// Importamos VoluntarioAdmin para el tipado del modal
import { CoordinadorService, SolicitudVoluntario, VoluntarioAdmin } from '../../../services/coordinador';
// Importamos el Modal de Detalle
import { ModalDetalleVoluntario } from '../../../components/modal-detalle-voluntario/modal-detalle-voluntario';

@Component({
  selector: 'app-aprob-voluntarios',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalDetalleVoluntario], // Añadido RouterModule
  templateUrl: './aprob-voluntarios.html',
})
export class AprobVoluntarios implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  solicitudes = signal<SolicitudVoluntario[]>([]);
  
  // Signals para los contadores
  countOrganizaciones = signal(0);
  countVoluntarios = signal(0);
  countActividades = signal(0);

  // Signal para controlar el modal de detalle (Tipo VoluntarioAdmin)
  volParaVer = signal<VoluntarioAdmin | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // 1. Cargar solicitudes de Voluntarios (Principal)
    this.coordinadorService.getSolicitudesVoluntarios().subscribe(data => {
      this.solicitudes.set(data);
      this.countVoluntarios.set(data.length);
    });

    // 2. Cargar contadores de las otras secciones
    this.coordinadorService.getSolicitudesOrganizaciones().subscribe(data => {
      this.countOrganizaciones.set(data.length);
    });

    this.coordinadorService.getSolicitudesActividades().subscribe(data => {
      this.countActividades.set(data.length);
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
    const volTemp: VoluntarioAdmin = {
      id: solicitud.id,
      nombre: solicitud.nombre,
      email: solicitud.email,
      curso: solicitud.curso,
      actividadesCount: 0, 
      estado: 'Pendiente'
    };
    
    this.volParaVer.set(volTemp);
  }

  cerrarDetalle() {
    this.volParaVer.set(null);
  }
}
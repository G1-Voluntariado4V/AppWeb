import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importante para que funcionen los enlaces
// Importamos ActividadAdmin para el mapeo del modal
import { CoordinadorService, SolicitudActividad, ActividadAdmin } from '../../../services/coordinador';
// Importamos el Modal de Detalle
import { ModalDetalleActividad } from '../../../components/modal-detalle-actividad/modal-detalle-actividad';

@Component({
  selector: 'app-aprob-actividades',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalDetalleActividad], // Añadido RouterModule
  templateUrl: './aprob-actividades.html',
})
export class AprobActividades implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  solicitudes = signal<SolicitudActividad[]>([]);
  
  // Signals para los contadores de los otros botones
  countOrganizaciones = signal(0);
  countVoluntarios = signal(0);

  // Signal para controlar el modal de detalle
  actParaVer = signal<ActividadAdmin | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // 1. Cargar las solicitudes de esta página (Actividades)
    this.coordinadorService.getSolicitudesActividades().subscribe(data => {
      this.solicitudes.set(data);
    });

    // 2. Cargar contadores de las otras secciones para los botones
    this.coordinadorService.getSolicitudesOrganizaciones().subscribe(data => {
      this.countOrganizaciones.set(data.length);
    });

    this.coordinadorService.getSolicitudesVoluntarios().subscribe(data => {
      this.countVoluntarios.set(data.length);
    });
  }

  // Añadimos 'event' para detener la propagación del click
  aprobar(id: number, event: Event) {
    event.stopPropagation();
    if(confirm('¿Publicar esta actividad? Será visible para los voluntarios.')) {
      this.coordinadorService.aprobarActividad(id).subscribe(() => this.cargarDatos());
    }
  }

  rechazar(id: number, event: Event) {
    event.stopPropagation();
    if(confirm('¿Rechazar propuesta de actividad?')) {
      this.coordinadorService.rechazarActividad(id).subscribe(() => this.cargarDatos());
    }
  }

  // --- LÓGICA DE DETALLE ---
  verDetalle(solicitud: SolicitudActividad) {
    const actTemp: ActividadAdmin = {
      id: solicitud.id,
      nombre: solicitud.actividad,
      organizador: solicitud.organizacion,
      fecha: solicitud.fechaPropuesta,
      tipo: 'Por definir', 
      estado: 'Pending',
      descripcion: 'Esta es una propuesta de actividad pendiente de validación.',
      ubicacion: 'Ubicación por confirmar',
      duracionHoras: 0,
      cupoMaximo: 0
    };
    
    this.actParaVer.set(actTemp);
  }

  cerrarDetalle() {
    this.actParaVer.set(null);
  }
}
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importamos ActividadAdmin para el mapeo del modal
import { CoordinadorService, SolicitudActividad, ActividadAdmin } from '../../../services/coordinador';
// Importamos el Modal de Detalle
import { ModalDetalleActividad } from '../../../components/modal-detalle-actividad/modal-detalle-actividad';

@Component({
  selector: 'app-aprob-actividades',
  standalone: true,
  imports: [CommonModule, ModalDetalleActividad],
  templateUrl: './aprob-actividades.html',
})
export class AprobActividades implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  solicitudes = signal<SolicitudActividad[]>([]);
  
  // Signal para controlar el modal de detalle
  actParaVer = signal<ActividadAdmin | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.coordinadorService.getSolicitudesActividades().subscribe(data => {
      this.solicitudes.set(data);
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
    // Convertimos la Solicitud (datos escasos) en ActividadAdmin (datos completos)
    // Rellenamos lo que falta con textos genéricos para visualización
    const actTemp: ActividadAdmin = {
      id: solicitud.id,
      nombre: solicitud.actividad,
      organizador: solicitud.organizacion,
      fecha: solicitud.fechaPropuesta,
      tipo: 'Por definir', // Dato que falta en la solicitud
      estado: 'Pending',
      descripcion: 'Esta es una propuesta de actividad pendiente de validación. Revisa los datos antes de aprobar.',
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
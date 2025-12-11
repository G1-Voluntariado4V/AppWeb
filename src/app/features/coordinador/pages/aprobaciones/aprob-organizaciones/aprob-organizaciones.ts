import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Necesario para routerLink
// Importamos los tipos y el servicio
import { CoordinadorService, SolicitudOrganizacion, OrganizacionAdmin } from '../../../services/coordinador';
// Importamos el Modal de Detalle
import { ModalDetalleOrganizacion } from '../../../components/modal-detalle-organizacion/modal-detalle-organizacion';

@Component({
  selector: 'app-aprob-organizaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalDetalleOrganizacion],
  templateUrl: './aprob-organizaciones.html',
})
export class AprobOrganizaciones implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  solicitudes = signal<SolicitudOrganizacion[]>([]);
  
  // Signals para los contadores de los otros botones
  countVoluntarios = signal(0);
  countActividades = signal(0);
  
  // Signal para controlar el modal de detalle
  orgParaVer = signal<OrganizacionAdmin | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // 1. Cargar las solicitudes de esta página (Organizaciones)
    this.coordinadorService.getSolicitudesOrganizaciones().subscribe(data => {
      this.solicitudes.set(data);
    });

    // 2. Cargar contadores de las otras secciones para los botones
    this.coordinadorService.getSolicitudesVoluntarios().subscribe(data => {
      this.countVoluntarios.set(data.length);
    });

    this.coordinadorService.getSolicitudesActividades().subscribe(data => {
      this.countActividades.set(data.length);
    });
  }

  // Métodos de acción
  aprobar(id: number, event: Event) {
    event.stopPropagation();
    if(confirm('¿Aprobar esta organización? Pasará a ser un usuario activo.')) {
      this.coordinadorService.aprobarOrganizacion(id).subscribe(() => {
        this.cargarDatos(); 
      });
    }
  }

  rechazar(id: number, event: Event) {
    event.stopPropagation();
    if(confirm('¿Rechazar solicitud? Se eliminará permanentemente.')) {
      this.coordinadorService.rechazarOrganizacion(id).subscribe(() => {
        this.cargarDatos();
      });
    }
  }

  // --- LÓGICA DE DETALLE ---
  verDetalle(solicitud: SolicitudOrganizacion) {
    const orgTemp: OrganizacionAdmin = {
      id: solicitud.id,
      nombre: solicitud.organizacion,
      tipo: solicitud.tipo,
      email: solicitud.email,
      contacto: 'Solicitante (Pendiente)',
      actividadesCount: 0,
      estado: 'Pending', // Usamos el estado en español si ya actualizaste el servicio, o 'Pending' si no.
      descripcion: 'Solicitud de registro pendiente de aprobación.',
      direccion: 'Dirección pendiente',
      sitioWeb: 'Pendiente',
      telefono: 'Pendiente'
    };
    
    this.orgParaVer.set(orgTemp);
  }

  cerrarDetalle() {
    this.orgParaVer.set(null);
  }
}
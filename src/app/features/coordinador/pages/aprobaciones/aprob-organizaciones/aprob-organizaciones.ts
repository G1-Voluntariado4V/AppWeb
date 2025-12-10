import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importamos OrganizacionAdmin para el tipado del modal
import { CoordinadorService, SolicitudOrganizacion, OrganizacionAdmin } from '../../../services/coordinador';
// Importamos el Modal de Detalle
import { ModalDetalleOrganizacion } from '../../../components/modal-detalle-organizacion/modal-detalle-organizacion';

@Component({
  selector: 'app-aprob-organizaciones',
  standalone: true,
  imports: [CommonModule, ModalDetalleOrganizacion],
  templateUrl: './aprob-organizaciones.html',
})
export class AprobOrganizaciones implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  solicitudes = signal<SolicitudOrganizacion[]>([]);
  
  // Signal para controlar el modal de detalle (Tipo OrganizacionAdmin)
  orgParaVer = signal<OrganizacionAdmin | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.coordinadorService.getSolicitudesOrganizaciones().subscribe(data => {
      this.solicitudes.set(data);
    });
  }

  // Añadimos 'event' para detener la propagación del click y que no se abra el detalle
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
    // Convertimos la Solicitud (datos escasos) en OrganizacionAdmin (datos completos)
    // para que el modal pueda mostrarla. Rellenamos lo que falta.
    const orgTemp: OrganizacionAdmin = {
      id: solicitud.id,
      nombre: solicitud.organizacion,
      tipo: solicitud.tipo,
      email: solicitud.email,
      contacto: 'Solicitante (Pendiente)', // Dato no disponible en la solicitud básica
      actividadesCount: 0,
      estado: 'Pending',
      descripcion: 'Solicitud de registro pendiente de aprobación. Revisar documentación adjunta si la hubiera.',
      direccion: 'Dirección pendiente de verificar',
      sitioWeb: 'Pendiente',
      telefono: 'Pendiente'
    };
    
    this.orgParaVer.set(orgTemp);
  }

  cerrarDetalle() {
    this.orgParaVer.set(null);
  }
}

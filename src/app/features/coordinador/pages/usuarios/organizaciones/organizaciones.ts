import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, OrganizacionAdmin } from '../../../services/coordinador';
import { ModalDetalleOrganizacion } from '../../../components/modal-detalle-organizacion/modal-detalle-organizacion';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-organizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalDetalleOrganizacion],
  templateUrl: './organizaciones.html',
})
export class Organizaciones implements OnInit {

  private coordinadorService = inject(CoordinadorService);
  private toastService = inject(ToastService);

  organizaciones = signal<OrganizacionAdmin[]>([]);
  busqueda = signal('');
  cargando = signal(true);

  // Filtros
  filtroEstado = signal('Todos');
  menuFiltroAbierto = signal(false);

  // Menú de acciones por fila
  menuAccionesAbiertoId = signal<number | null>(null);

  // Estados disponibles
  estadosDisponibles = ['Todos', 'Activa', 'Pendiente', 'Bloqueada', 'Rechazada'];

  // Modal de detalle
  orgSeleccionada = signal<OrganizacionAdmin | null>(null);

  // Filtrado
  organizacionesFiltradas = computed(() => {
    const term = this.busqueda().toLowerCase();
    const estado = this.filtroEstado();

    return this.organizaciones().filter(org => {
      const matchTexto = org.nombre.toLowerCase().includes(term) ||
        org.email.toLowerCase().includes(term) ||
        (org.cif?.toLowerCase().includes(term) ?? false);
      const matchEstado = estado === 'Todos' || org.estado === estado;
      return matchTexto && matchEstado;
    });
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);
    this.coordinadorService.getOrganizaciones().subscribe({
      next: (data) => {
        this.organizaciones.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  // Filtros
  toggleFiltro() {
    this.menuFiltroAbierto.update(v => !v);
  }

  seleccionarFiltro(estado: string) {
    this.filtroEstado.set(estado);
    this.menuFiltroAbierto.set(false);
  }

  // Menú de acciones
  toggleMenuAcciones(id: number, event: Event) {
    event.stopPropagation();
    this.menuAccionesAbiertoId.update(currentId => currentId === id ? null : id);
  }

  cerrarMenuAcciones() {
    this.menuAccionesAbiertoId.set(null);
  }

  // Acciones
  activar(org: OrganizacionAdmin, event: Event) {
    event.stopPropagation();
    if (confirm(`¿Activar cuenta de ${org.nombre}?`)) {
      this.coordinadorService.cambiarEstadoUsuario(org.id, 'organizaciones', 'Activa').subscribe({
        next: () => {
          this.cargarDatos();
          this.cerrarMenuAcciones();
        },
        error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  bloquear(org: OrganizacionAdmin, event: Event) {
    event.stopPropagation();
    if (confirm(`¿Bloquear cuenta de ${org.nombre}?`)) {
      this.coordinadorService.bloquearUsuario(org.id, 'organizaciones').subscribe({
        next: () => {
          this.cargarDatos();
          this.cerrarMenuAcciones();
        },
        error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  rechazar(org: OrganizacionAdmin, event: Event) {
    event.stopPropagation();
    if (confirm(`¿Rechazar cuenta de ${org.nombre}?`)) {
      this.coordinadorService.rechazarOrganizacion(org.id).subscribe({
        next: () => {
          this.cargarDatos();
          this.cerrarMenuAcciones();
        },
        error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  eliminar(org: OrganizacionAdmin, event: Event) {
    event.stopPropagation();
    if (confirm(`¿Eliminar permanentemente a ${org.nombre}? Esta acción no se puede deshacer.`)) {
      this.coordinadorService.eliminarUsuario(org.id).subscribe({
        next: () => {
          this.cargarDatos();
          this.cerrarMenuAcciones();
        },
        error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  // Detalle
  verDetalle(org: OrganizacionAdmin) {
    this.orgSeleccionada.set(org);
  }

  cerrarDetalle() {
    this.orgSeleccionada.set(null);
  }

  // Helpers
  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      'Activa': 'bg-green-50 text-green-600 border-green-100',
      'Pendiente': 'bg-orange-50 text-orange-600 border-orange-100',
      'Bloqueada': 'bg-red-50 text-red-600 border-red-100',
      'Rechazada': 'bg-gray-100 text-gray-500 border-gray-200'
    };
    return clases[estado] || 'bg-gray-100 text-gray-500 border-gray-200';
  }
}
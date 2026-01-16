import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService, ActividadOrg } from '../../services/organizacion.service';
import { ModalCrearActividad } from '../../components/modal-crear-actividad/modal-crear-actividad';
import { ModalDetalleActividad } from '../../components/modal-detalle-actividad/modal-detalle-actividad';

@Component({
  selector: 'app-actividades-org',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCrearActividad, ModalDetalleActividad],
  templateUrl: './actividades.html',
})
export class Actividades {

  private orgService = inject(OrganizacionService);

  // Enlazamos directamente a las señales del servicio
  actividades = this.orgService.actividades;
  cargando = this.orgService.cargandoActividades;

  busqueda = signal('');
  filtroEstado = signal('Todos');
  menuFiltroAbierto = signal(false);

  // Modales
  modalCrearVisible = signal(false);
  actividadSeleccionada = signal<ActividadOrg | null>(null);

  // Estados disponibles para filtrar
  estadosDisponibles = ['Todos', 'En revision', 'Publicada', 'Finalizada', 'Rechazada'];

  // --- FILTROS ---
  actividadesFiltradas = computed(() => {
    const term = this.busqueda().toLowerCase();
    const estado = this.filtroEstado();

    return this.actividades().filter(act => {
      const matchTexto = act.titulo.toLowerCase().includes(term) ||
        (act.descripcion?.toLowerCase().includes(term) ?? false) ||
        (act.ubicacion?.toLowerCase().includes(term) ?? false);
      const matchEstado = estado === 'Todos' || act.estado === estado;
      return matchTexto && matchEstado;
    });
  });

  // Contadores por estado
  contadores = computed(() => {
    const acts = this.actividades();
    return {
      todos: acts.length,
      enRevision: acts.filter(a => a.estado === 'En revision').length,
      publicadas: acts.filter(a => a.estado === 'Publicada').length,
      finalizadas: acts.filter(a => a.estado === 'Finalizada').length,
      rechazadas: acts.filter(a => a.estado === 'Rechazada').length
    };
  });

  toggleFiltro() { this.menuFiltroAbierto.update(v => !v); }

  seleccionarFiltro(estado: string) {
    this.filtroEstado.set(estado);
    this.menuFiltroAbierto.set(false);
  }

  // --- ACCIONES ---
  abrirCrear() { this.modalCrearVisible.set(true); }
  cerrarCrear() { this.modalCrearVisible.set(false); }

  onActividadCreada(respuesta: any) {
    console.log('Actividad creada:', respuesta);
    // El servicio ya recarga las actividades automáticamente
  }

  verDetalle(act: ActividadOrg) { this.actividadSeleccionada.set(act); }
  cerrarDetalle() { this.actividadSeleccionada.set(null); }

  recargar() {
    this.orgService.recargarDatos();
  }

  // Helpers para UI
  getEstadoClase(estado: string): string {
    const clases: { [key: string]: string } = {
      'En revision': 'bg-amber-100 text-amber-700',
      'Publicada': 'bg-green-100 text-green-700',
      'Finalizada': 'bg-blue-100 text-blue-700',
      'Rechazada': 'bg-red-100 text-red-700'
    };
    return clases[estado] || 'bg-gray-100 text-gray-600';
  }

  getEstadoIcono(estado: string): string {
    const iconos: { [key: string]: string } = {
      'En revision': 'fa-clock',
      'Publicada': 'fa-check-circle',
      'Finalizada': 'fa-flag-checkered',
      'Rechazada': 'fa-times-circle'
    };
    return iconos[estado] || 'fa-circle';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }
}
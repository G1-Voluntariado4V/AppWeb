import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, ActividadAdmin, ODS, TipoVoluntariado } from '../../services/coordinador';
import { ModalCrearActividad } from '../../components/modal-crear-actividad/modal-crear-actividad';
import { ModalDetalleActividad } from '../../components/modal-detalle-actividad/modal-detalle-actividad';
import { ModalParticipantes } from '../../components/modal-participantes/modal-participantes';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCrearActividad, ModalDetalleActividad, ModalParticipantes],
  templateUrl: './actividades.html',
})
export class Actividades implements OnInit {

  private coordinadorService = inject(CoordinadorService);
  private toastService = inject(ToastService);

  actividades = signal<ActividadAdmin[]>([]);
  busqueda = signal('');
  cargando = signal(true);

  // Filtros
  filtroEstado = signal('Todos');
  menuFiltroAbierto = signal(false);

  // Modales
  modalCrearVisible = signal(false);
  actividadSeleccionada = signal<ActividadAdmin | null>(null);
  actividadParaEditar = signal<ActividadAdmin | null>(null);
  actividadParaVerParticipantes = signal<ActividadAdmin | null>(null);

  // Estados disponibles para filtro
  estadosDisponibles = ['Todos', 'Publicada', 'En revision', 'Cancelada', 'Rechazada', 'Finalizada'];

  // Computed para filtrar
  actividadesFiltradas = computed(() => {
    const term = this.busqueda().toLowerCase();
    const estado = this.filtroEstado();

    return this.actividades().filter(act => {
      const matchTexto = act.titulo.toLowerCase().includes(term) ||
        act.organizacion.toLowerCase().includes(term);
      const matchEstado = estado === 'Todos' || act.estado === estado;
      return matchTexto && matchEstado;
    });
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);
    this.coordinadorService.getActividades().subscribe({
      next: (data) => {
        this.actividades.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toastService.error('Error al cargar las actividades');
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

  // Modal Crear
  abrirModalCrear() {
    this.actividadParaEditar.set(null); // Asegurar que es creación, no edición
    this.modalCrearVisible.set(true);
  }
  cerrarModalCrear() {
    this.modalCrearVisible.set(false);
    this.actividadParaEditar.set(null);
  }

  guardarNuevaActividad(datos: any) {
    const actividadEdit = this.actividadParaEditar();

    if (actividadEdit) {
      // Modo edición
      this.coordinadorService.editarActividad(actividadEdit.id, datos).subscribe({
        next: () => {
          this.cargarDatos();
          this.toastService.success('Actividad actualizada correctamente');
          this.cerrarModalCrear();
        },
        error: (err) => {
          this.toastService.error('Error al actualizar: ' + (err.error?.error || 'Error desconocido'));
        }
      });
    } else {
      // Modo creación
      this.coordinadorService.crearActividad(datos).subscribe({
        next: () => {
          this.cargarDatos();
          this.toastService.success('Actividad creada correctamente');
          this.cerrarModalCrear();
        },
        error: (err) => {
          this.toastService.error('Error al crear: ' + (err.error?.error || 'Error desconocido'));
        }
      });
    }
  }

  // Modal Detalle
  verDetalle(act: ActividadAdmin) { this.actividadSeleccionada.set(act); }
  cerrarDetalle() { this.actividadSeleccionada.set(null); }

  // Editar - IMPLEMENTADO (FIX BUG-017)
  editar(id: number, event: Event) {
    event.stopPropagation();
    const actividad = this.actividades().find(a => a.id === id);
    if (actividad) {
      this.actividadParaEditar.set(actividad);
      this.modalCrearVisible.set(true);
    }
  }

  // Aprobar / Rechazar
  aprobar(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Publicar esta actividad?')) {
      this.coordinadorService.aprobarActividad(id).subscribe({
        next: () => {
          this.cargarDatos();
          this.toastService.success('Actividad publicada');
        },
        error: (err) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  rechazar(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Rechazar esta actividad?')) {
      this.coordinadorService.rechazarActividad(id).subscribe({
        next: () => {
          this.cargarDatos();
          this.toastService.success('Actividad rechazada');
        },
        error: (err) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  eliminar(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Eliminar esta actividad? Esta acción no se puede deshacer.')) {
      this.coordinadorService.eliminarActividad(id).subscribe({
        next: () => {
          this.cargarDatos();
          this.toastService.success('Actividad eliminada');
        },
        error: (err) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
      });
    }
  }

  verParticipantes(act: ActividadAdmin, event: Event) {
    event.stopPropagation();
    this.actividadParaVerParticipantes.set(act);
  }

  cerrarParticipantes() {
    this.actividadParaVerParticipantes.set(null);
  }

  // Helper para formatear fecha
  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  // Helper para clases de estado
  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      'Publicada': 'bg-green-50 text-green-600',
      'En revision': 'bg-orange-50 text-orange-600',
      'Cancelada': 'bg-gray-100 text-gray-500',
      'Rechazada': 'bg-red-50 text-red-600',
      'Finalizada': 'bg-blue-50 text-blue-600'
    };
    return clases[estado] || 'bg-gray-100 text-gray-500';
  }
}

import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { VoluntarioService, MiActividad } from '../../services/voluntario.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './historial.html',
})
export class Historial implements OnInit {

  private route = inject(ActivatedRoute);
  private voluntarioService = inject(VoluntarioService);

  menuAbierto = signal(false);
  filtroActual = signal<string>('Todos');
  modalDesapuntar = signal<MiActividad | null>(null);
  procesando = signal(false);
  mensaje = signal<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  cargando = computed(() => this.voluntarioService.cargando());
  actividades = computed(() => this.voluntarioService.misActividades());

  // Estadísticas
  estadisticas = computed(() => {
    const acts = this.actividades();
    return {
      total: acts.length,
      aceptadas: acts.filter(a => a.estado_solicitud === 'Aceptada').length,
      pendientes: acts.filter(a => a.estado_solicitud === 'Pendiente').length,
      finalizadas: acts.filter(a => a.estado_solicitud === 'Finalizada').length,
      rechazadas: acts.filter(a => a.estado_solicitud === 'Rechazada').length,
      canceladas: acts.filter(a => a.estado_solicitud === 'Cancelada').length
    };
  });

  actividadesVisibles = computed(() => {
    const filtro = this.filtroActual();
    const lista = this.actividades();

    if (filtro === 'Todos') {
      return lista;
    }

    if (filtro === 'Activas') {
      return lista.filter(act => act.estado_solicitud === 'Aceptada' || act.estado_solicitud === 'Pendiente');
    }

    return lista.filter(act => act.estado_solicitud === filtro);
  });

  ngOnInit() {
    // Leer filtro de query params
    this.route.queryParams.subscribe(params => {
      if (params['filtro']) {
        this.seleccionarFiltro(params['filtro']);
      }
    });

    // Siempre recargar datos al entrar para tener info actualizada
    this.voluntarioService.cargarTodo();
  }

  toggleMenu() {
    this.menuAbierto.update(v => !v);
  }

  seleccionarFiltro(estado: string) {
    this.filtroActual.set(estado);
    this.menuAbierto.set(false);
  }

  abrirModalDesapuntar(actividad: MiActividad) {
    this.modalDesapuntar.set(actividad);
    this.mensaje.set(null);
  }

  cerrarModal() {
    this.modalDesapuntar.set(null);
    this.mensaje.set(null);
  }

  confirmarDesapuntar() {
    const actividad = this.modalDesapuntar();
    if (!actividad) return;

    this.procesando.set(true);
    this.mensaje.set(null);

    this.voluntarioService.desapuntarse(actividad.id_actividad).subscribe({
      next: (result) => {
        if (result.success) {
          this.mensaje.set({ tipo: 'success', texto: 'Te has desapuntado correctamente.' });
          setTimeout(() => this.cerrarModal(), 1500);
        } else {
          this.mensaje.set({ tipo: 'error', texto: result.mensaje });
        }
        this.procesando.set(false);
      },
      error: () => {
        this.mensaje.set({ tipo: 'error', texto: 'Error al desapuntarse. Intenta de nuevo.' });
        this.procesando.set(false);
      }
    });
  }

  puedeDesapuntarse(actividad: MiActividad): boolean {
    return actividad.estado_solicitud === 'Pendiente' || actividad.estado_solicitud === 'Aceptada';
  }

  getClassEstado(estado: string): string {
    switch (estado) {
      case 'Aceptada': return 'bg-green-100 text-green-700 border-green-200';
      case 'Finalizada': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Pendiente': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Rechazada': return 'bg-red-50 text-red-600 border-red-100';
      case 'Cancelada': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-500';
    }
  }

  getIconoEstado(estado: string): string {
    switch (estado) {
      case 'Aceptada': return 'fa-check-circle';
      case 'Finalizada': return 'fa-flag-checkered';
      case 'Pendiente': return 'fa-clock';
      case 'Rechazada': return 'fa-times-circle';
      case 'Cancelada': return 'fa-ban';
      default: return 'fa-question-circle';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  }
}
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VoluntarioService, MiActividad } from '../../services/voluntario.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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

  // Nuevos filtros
  filtroOrg = signal<string>('Todas');
  filtroTipo = signal<string>('Todos');
  filtroOds = signal<string>('Todos');
  busqueda = signal<string>('');

  // Modal de Organización
  modalOrgAbierto = signal(false);
  orgSeleccionada = signal<any>(null);
  cargandoOrg = signal(false);

  cargando = computed(() => this.voluntarioService.cargando());
  actividades = computed(() => this.voluntarioService.misActividades());

  // Catálogos
  tiposCatalogo = computed(() => this.voluntarioService.tiposCatalogo());
  odsCatalogo = computed(() => this.voluntarioService.odsCatalogo());

  // Opciones para filtros
  organizacionesDisponibles = computed(() => {
    const orgs = new Set<string>();
    this.actividades().forEach(a => {
      if (a.organizacion) orgs.add(a.organizacion);
    });
    return ['Todas', ...Array.from(orgs).sort()];
  });

  tiposDisponibles = computed(() => {
    const catalogo = this.tiposCatalogo();
    if (catalogo && catalogo.length > 0) {
      return ['Todos', ...catalogo.map(t => t.nombreTipo).sort()];
    }
    // Fallback: extraer de actividades
    const tipos = new Set<string>();
    this.actividades().forEach(a => {
      if (a.tipos) a.tipos.forEach(t => tipos.add(t));
    });
    return ['Todos', ...Array.from(tipos).sort()];
  });

  odsDisponibles = computed(() => {
    const catalogo = this.odsCatalogo();
    if (catalogo && catalogo.length > 0) {
      return ['Todos', ...catalogo.map(o => `ODS ${o.id}: ${o.nombre}`)];
    }
    return ['Todos'];
  });

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
    const filtroEstado = this.filtroActual();
    const filtroOrg = this.filtroOrg();
    const filtroTipo = this.filtroTipo();
    const filtroOds = this.filtroOds();
    const busqueda = this.busqueda().toLowerCase().trim();

    let lista = this.actividades();

    // Filtro por estado
    if (filtroEstado !== 'Todos') {
      if (filtroEstado === 'Activas') {
        lista = lista.filter(act => act.estado_solicitud === 'Aceptada' || act.estado_solicitud === 'Pendiente');
      } else {
        lista = lista.filter(act => act.estado_solicitud === filtroEstado);
      }
    }

    // Filtro por organización
    if (filtroOrg !== 'Todas') {
      lista = lista.filter(act => act.organizacion === filtroOrg);
    }

    // Filtro por tipo
    if (filtroTipo !== 'Todos') {
      lista = lista.filter(act =>
        act.tipos && act.tipos.some(t => t.toLowerCase() === filtroTipo.toLowerCase())
      );
    }

    // Filtro por ODS
    if (filtroOds !== 'Todos') {
      const odsIdMatch = filtroOds.match(/ODS (\d+):/);
      if (odsIdMatch) {
        const odsId = parseInt(odsIdMatch[1], 10);
        lista = lista.filter(act =>
          act.ods && act.ods.some(o => o.id === odsId)
        );
      }
    }

    // Filtro por búsqueda
    if (busqueda) {
      lista = lista.filter(act =>
        act.titulo.toLowerCase().includes(busqueda) ||
        act.organizacion.toLowerCase().includes(busqueda) ||
        (act.descripcion && act.descripcion.toLowerCase().includes(busqueda)) ||
        (act.ubicacion && act.ubicacion.toLowerCase().includes(busqueda))
      );
    }

    return lista;
  });

  hayFiltrosActivos = computed(() => {
    return this.filtroActual() !== 'Todos' ||
           this.filtroOrg() !== 'Todas' ||
           this.filtroTipo() !== 'Todos' ||
           this.filtroOds() !== 'Todos' ||
           this.busqueda().trim() !== '';
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

  limpiarFiltros() {
    this.filtroActual.set('Todos');
    this.filtroOrg.set('Todas');
    this.filtroTipo.set('Todos');
    this.filtroOds.set('Todos');
    this.busqueda.set('');
  }

  // Modal de Organización
  abrirModalOrg(nombreOrganizacion: string) {
    if (!nombreOrganizacion) return;

    // Buscar id_organizacion desde las actividades disponibles del servicio
    const actividades = this.voluntarioService.actividadesDisponibles();
    const actConOrg = actividades.find(a => a.organizacion === nombreOrganizacion);

    if (actConOrg && actConOrg.id_organizacion) {
      this.cargandoOrg.set(true);
      this.orgSeleccionada.set(null);
      this.modalOrgAbierto.set(true);

      this.voluntarioService.getOrganizacion(actConOrg.id_organizacion).subscribe({
        next: (org) => {
          this.orgSeleccionada.set(org);
          this.cargandoOrg.set(false);
        },
        error: () => {
          this.cargandoOrg.set(false);
          this.cerrarModalOrg();
        }
      });
    }
  }

  cerrarModalOrg() {
    this.modalOrgAbierto.set(false);
    this.orgSeleccionada.set(null);
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

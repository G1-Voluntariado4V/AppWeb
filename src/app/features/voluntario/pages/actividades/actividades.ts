import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoluntarioService, ActividadDisponible } from '../../services/voluntario.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-actividades-disponibles',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './actividades.html',
})
export class ActividadesDisponibles implements OnInit {
    private voluntarioService = inject(VoluntarioService);

    baseUrl = `${environment.apiUrl}/uploads/actividades/`;

    // Filtros
    busqueda = signal('');
    filtroTipo = signal<string>('Todos');
    filtroUbicacion = signal<string>('Todas');
    filtroOds = signal<string>('Todos');
    filtroOrg = signal<string>('Todas');
    filtroFecha = signal<string>(''); // Fecha específica YYYY-MM-DD
    soloDisponibles = signal(false);

    // Actividades cargadas con filtros de servidor
    actividadesConFiltro = signal<ActividadDisponible[]>([]);
    usandoFiltroServidor = signal(false);
    cargandoFiltros = signal(false);

    // Estados
    cargando = computed(() => this.voluntarioService.cargando());
    modalAbierto = signal(false);
    actividadSeleccionada = signal<ActividadDisponible | null>(null);
    cargandoDetalle = signal(false);
    procesando = signal(false);
    mensaje = signal<{ tipo: 'success' | 'error'; texto: string } | null>(null);

    // Modal de Organización
    modalOrgAbierto = signal(false);
    orgSeleccionada = signal<any>(null);
    cargandoOrg = signal(false);

    // Datos base (todas las actividades sin filtro de servidor)
    actividadesBase = computed(() => this.voluntarioService.actividadesDisponibles());

    // Datos a usar (pueden ser las base o las filtradas por servidor)
    actividades = computed(() => {
        if (this.usandoFiltroServidor()) {
            return this.actividadesConFiltro();
        }
        return this.actividadesBase();
    });

    // Datos del catálogo (traídos del servicio)
    tiposCatalogo = computed(() => {
        const tipos = this.voluntarioService.tiposCatalogo();
        return tipos;
    });
    odsCatalogo = computed(() => {
        const ods = this.voluntarioService.odsCatalogo();
        return ods;
    });

    // Filtros disponibles para la vista (Selects)
    tiposDisponibles = computed(() => {
        const catalogo = this.tiposCatalogo();
        if (!catalogo || catalogo.length === 0) {
            return ['Todos'];
        }
        const tipos = catalogo.map(t => t.nombreTipo).filter(t => t && t.length > 0);
        return ['Todos', ...tipos.sort()];
    });

    odsDisponibles = computed(() => {
        const catalogo = this.odsCatalogo();
        if (!catalogo || catalogo.length === 0) {
            return ['Todos'];
        }
        const ods = catalogo.map(o => `ODS ${o.id}: ${o.nombre}`).filter(o => o.length > 5);
        return ['Todos', ...ods.sort((a, b) => {
            const numA = parseInt(a.match(/ODS (\d+)/)?.[1] || '0');
            const numB = parseInt(b.match(/ODS (\d+)/)?.[1] || '0');
            return numA - numB;
        })];
    });

    ubicacionesUnicas = computed(() => {
        const ubicaciones = new Set<string>();
        this.actividadesBase().forEach(act => {
            if (act.ubicacion) ubicaciones.add(act.ubicacion);
        });
        return ['Todas', ...Array.from(ubicaciones).sort()];
    });

    orgsUnicas = computed(() => {
        const orgs = new Set<string>();
        this.actividadesBase().forEach(act => {
            if (act.organizacion) orgs.add(act.organizacion);
        });
        return ['Todas', ...Array.from(orgs).sort()];
    });

    constructor() {
        // Efecto reactivo para recargar actividades cuando cambian los filtros de ODS o tipo
        effect(() => {
            const odsSeleccionado = this.filtroOds();
            const tipoSeleccionado = this.filtroTipo();

            // Obtener IDs para los filtros de servidor
            let odsId: number | undefined;
            let tipoId: number | undefined;

            // Extraer ID del ODS seleccionado
            if (odsSeleccionado && odsSeleccionado !== 'Todos') {
                const match = odsSeleccionado.match(/ODS\s*(\d+)/i);
                odsId = match ? parseInt(match[1], 10) : undefined;
            }

            // Extraer ID del tipo seleccionado
            if (tipoSeleccionado && tipoSeleccionado !== 'Todos') {
                const catalogo = this.tiposCatalogo();
                const tipoEncontrado = catalogo.find(t =>
                    t.nombreTipo.toLowerCase().trim() === tipoSeleccionado.toLowerCase().trim()
                );
                tipoId = tipoEncontrado?.id;
            }

            // Si hay filtro de ODS o tipo, usar filtro de servidor
            if (odsId || tipoId) {
                this.usandoFiltroServidor.set(true);
                this.cargandoFiltros.set(true);
                this.voluntarioService.cargarActividadesConFiltros(odsId, tipoId).subscribe({
                    next: (actividades) => {
                        this.actividadesConFiltro.set(actividades);
                        this.cargandoFiltros.set(false);
                    },
                    error: () => {
                        this.cargandoFiltros.set(false);
                    }
                });
            } else {
                this.usandoFiltroServidor.set(false);
                this.cargandoFiltros.set(false);
                this.actividadesConFiltro.set([]);
            }
        });
    }


    // Actividades filtradas (filtros locales adicionales)
    actividadesFiltradas = computed(() => {
        let resultado = this.actividades();
        const busq = this.busqueda().toLowerCase().trim();
        const ubicacion = this.filtroUbicacion();
        const org = this.filtroOrg();
        const fecha = this.filtroFecha();
        const soloDisp = this.soloDisponibles();

        // Filtro por búsqueda de texto
        if (busq) {
            resultado = resultado.filter(act =>
                act.titulo.toLowerCase().includes(busq) ||
                act.descripcion.toLowerCase().includes(busq) ||
                act.organizacion.toLowerCase().includes(busq)
            );
        }

        // Filtro por ubicación
        if (ubicacion && ubicacion !== 'Todas') {
            resultado = resultado.filter(act => act.ubicacion === ubicacion);
        }

        // Filtro por organización
        if (org && org !== 'Todas') {
            resultado = resultado.filter(act => act.organizacion === org);
        }

        // Filtro por fecha
        if (fecha) {
            resultado = resultado.filter(act => act.fecha_inicio && act.fecha_inicio.startsWith(fecha));
        }

        // Filtro solo con plazas disponibles
        if (soloDisp) {
            resultado = resultado.filter(act =>
                act.cupo_maximo === 0 || act.voluntarios_inscritos < act.cupo_maximo
            );
        }

        return resultado;
    });

    // Estadísticas (usar actividades base para totales)
    estadisticas = computed(() => ({
        total: this.actividadesBase().length,
        disponibles: this.actividadesBase().filter(a =>
            a.cupo_maximo === 0 || a.voluntarios_inscritos < a.cupo_maximo
        ).length,
        inscritas: this.actividadesBase().filter(a => a.inscrito).length
    }));

    ngOnInit() {
        // Los datos ya se cargan automáticamente desde el servicio
        // pero podemos forzar una recarga si es necesario
        if (this.actividadesBase().length === 0) {
            this.voluntarioService.cargarTodo();
        }
    }

    limpiarFiltros() {
        this.busqueda.set('');
        this.filtroTipo.set('Todos');
        this.filtroUbicacion.set('Todas');
        this.filtroOds.set('Todos');
        this.filtroOrg.set('Todas');
        this.filtroFecha.set('');
        this.soloDisponibles.set(false);
    }

    abrirModal(actividad: ActividadDisponible) {
        // Mostrar el modal inmediatamente con los datos básicos
        this.actividadSeleccionada.set(actividad);
        this.modalAbierto.set(true);
        this.mensaje.set(null);
        this.cargandoDetalle.set(true);

        // Cargar los detalles completos (incluyendo ODS y tipos)
        this.voluntarioService.getDetalleActividad(actividad.id_actividad).subscribe({
            next: (detalleCompleto) => {
                if (detalleCompleto) {
                    // Preservar el estado de inscripción de la actividad original
                    detalleCompleto.inscrito = actividad.inscrito;
                    detalleCompleto.estadoInscripcion = actividad.estadoInscripcion;

                    // Preservar imagen si el detalle no la trae
                    if (!detalleCompleto.imagen && actividad.imagen) {
                        detalleCompleto.imagen = actividad.imagen;
                    }

                    this.actividadSeleccionada.set(detalleCompleto);
                }
                this.cargandoDetalle.set(false);
            },
            error: () => {
                this.cargandoDetalle.set(false);
            }
        });
    }

    cerrarModal() {
        this.modalAbierto.set(false);
        this.actividadSeleccionada.set(null);
        this.mensaje.set(null);
    }

    abrirModalOrg(idOrganizacion: number) {
        if (!idOrganizacion) return;

        this.cargandoOrg.set(true);
        this.orgSeleccionada.set(null);
        this.modalOrgAbierto.set(true);

        this.voluntarioService.getOrganizacion(idOrganizacion).subscribe(org => {
            this.orgSeleccionada.set(org);
            this.cargandoOrg.set(false);
        });
    }

    cerrarModalOrg() {
        this.modalOrgAbierto.set(false);
        this.orgSeleccionada.set(null);
    }

    inscribirse(actividad: ActividadDisponible) {
        this.procesando.set(true);
        this.mensaje.set(null);

        this.voluntarioService.inscribirse(actividad.id_actividad).subscribe({
            next: (result) => {
                // Manejo especial para conflicto (ya inscrito)
                const yaInscrito = !result.success && (
                    (result.mensaje && (result.mensaje.includes('409') || result.mensaje.toLowerCase().includes('conflict') || result.mensaje.toLowerCase().includes('ya est')))
                );

                if (result.success || yaInscrito) {
                    const texto = yaInscrito
                        ? 'Ya estabas inscrito en esta actividad. Estado actualizado.'
                        : '¡Te has inscrito correctamente! Tu solicitud está pendiente de aprobación.';

                    this.mensaje.set({ type: 'success', texto: texto } as any); // Type cast rápido si la interfaz difiere

                    // Si estaba ya inscrito, forzamos actualización visual local
                    if (yaInscrito) {
                        this.voluntarioService.actividadesDisponibles.update(acts =>
                            acts.map(a => a.id_actividad === actividad.id_actividad
                                ? { ...a, inscrito: true, estadoInscripcion: 'Pendiente' }
                                : a
                            )
                        );
                        // Y en la seleccionada
                        if (this.actividadSeleccionada()?.id_actividad === actividad.id_actividad) {
                            this.actividadSeleccionada.update(a => a ? ({ ...a, inscrito: true, estadoInscripcion: 'Pendiente' }) : null);
                        }
                    }

                    // Cerrar modal después de 2 segundos
                    setTimeout(() => this.cerrarModal(), 2000);
                } else {
                    this.mensaje.set({ tipo: 'error', texto: result.mensaje });
                }
                this.procesando.set(false);
            },
            error: (err) => {
                console.error('Error en suscripción:', err);
                this.mensaje.set({ tipo: 'error', texto: 'Error al procesar la inscripción.' });
                this.procesando.set(false);
            }
        });
    }

    desapuntarse(actividad: ActividadDisponible) {
        if (!confirm('¿Seguro que quieres desapuntarte de esta actividad?')) return;

        this.procesando.set(true);
        this.mensaje.set(null);

        this.voluntarioService.desapuntarse(actividad.id_actividad).subscribe({
            next: (result) => {
                // Manejo especial para 404 (ya eliminado)
                const yaEliminado = !result.success && (
                    (result.mensaje && (result.mensaje.includes('404') || result.mensaje.toLowerCase().includes('not found') || result.mensaje.toLowerCase().includes('no encontrada')))
                );

                if (result.success || yaEliminado) {
                    const texto = yaEliminado
                        ? 'Ya no estabas inscrito en esta actividad. Estado actualizado.'
                        : 'Te has desapuntado correctamente.';

                    this.mensaje.set({ type: 'success', texto: texto } as any);

                    // Forzar actualización visual local
                    this.voluntarioService.actividadesDisponibles.update(acts =>
                        acts.map(a => a.id_actividad === actividad.id_actividad
                            ? { ...a, inscrito: false, estadoInscripcion: null }
                            : a
                        )
                    );

                    // Y en la seleccionada
                    if (this.actividadSeleccionada()?.id_actividad === actividad.id_actividad) {
                        this.actividadSeleccionada.update(a => a ? ({ ...a, inscrito: false, estadoInscripcion: null }) : null);
                    }

                    setTimeout(() => this.cerrarModal(), 1500);
                } else {
                    this.mensaje.set({ tipo: 'error', texto: result.mensaje });
                }
                this.procesando.set(false);
            },
            error: (err) => {
                console.error('Error desapuntándose:', err);
                this.mensaje.set({ tipo: 'error', texto: 'Error al desapuntarse. Intenta de nuevo.' });
                this.procesando.set(false);
            }
        });
    }

    getPlazasTexto(act: ActividadDisponible): string {
        if (act.cupo_maximo === 0) return 'Sin límite';
        const disponibles = act.cupo_maximo - act.voluntarios_inscritos;
        return `${disponibles} de ${act.cupo_maximo} plazas`;
    }

    getPlazasPorcentaje(act: ActividadDisponible): number {
        if (act.cupo_maximo === 0) return 0;
        return (act.voluntarios_inscritos / act.cupo_maximo) * 100;
    }

    estaLlena(act: ActividadDisponible): boolean {
        return act.cupo_maximo > 0 && act.voluntarios_inscritos >= act.cupo_maximo;
    }

    formatearFecha(fecha: string): string {
        if (!fecha) return '';
        try {
            const date = new Date(fecha);
            return date.toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return fecha;
        }
    }

    getEstadoInscripcionClass(estado: string | null | undefined): string {
        switch (estado) {
            case 'Aceptada': return 'bg-green-100 text-green-700';
            case 'Pendiente': return 'bg-orange-100 text-orange-700';
            case 'Rechazada': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    }
}

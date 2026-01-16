import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoluntarioService, ActividadDisponible } from '../../services/voluntario.service';

@Component({
    selector: 'app-actividades-disponibles',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './actividades.html',
})
export class ActividadesDisponibles implements OnInit {
    private voluntarioService = inject(VoluntarioService);

    // Filtros
    busqueda = signal('');
    filtroTipo = signal<string>('Todos');
    filtroUbicacion = signal<string>('Todas');
    soloDisponibles = signal(true);

    // Estados
    cargando = computed(() => this.voluntarioService.cargando());
    modalAbierto = signal(false);
    actividadSeleccionada = signal<ActividadDisponible | null>(null);
    procesando = signal(false);
    mensaje = signal<{ tipo: 'success' | 'error'; texto: string } | null>(null);

    // Datos
    actividades = computed(() => this.voluntarioService.actividadesDisponibles());

    // Filtros únicos extraídos de los datos
    tiposUnicos = computed(() => {
        const tipos = new Set<string>();
        this.actividades().forEach(act => {
            act.tipos?.forEach(t => tipos.add(t));
        });
        return ['Todos', ...Array.from(tipos)];
    });

    ubicacionesUnicas = computed(() => {
        const ubicaciones = new Set<string>();
        this.actividades().forEach(act => {
            if (act.ubicacion) ubicaciones.add(act.ubicacion);
        });
        return ['Todas', ...Array.from(ubicaciones)];
    });

    // Actividades filtradas
    actividadesFiltradas = computed(() => {
        let resultado = this.actividades();
        const busq = this.busqueda().toLowerCase();
        const tipo = this.filtroTipo();
        const ubicacion = this.filtroUbicacion();
        const soloDisp = this.soloDisponibles();

        if (busq) {
            resultado = resultado.filter(act =>
                act.titulo.toLowerCase().includes(busq) ||
                act.descripcion.toLowerCase().includes(busq) ||
                act.organizacion.toLowerCase().includes(busq)
            );
        }

        if (tipo !== 'Todos') {
            resultado = resultado.filter(act => act.tipos?.includes(tipo));
        }

        if (ubicacion !== 'Todas') {
            resultado = resultado.filter(act => act.ubicacion === ubicacion);
        }

        if (soloDisp) {
            resultado = resultado.filter(act =>
                act.cupo_maximo === 0 || act.voluntarios_inscritos < act.cupo_maximo
            );
        }

        return resultado;
    });

    // Estadísticas
    estadisticas = computed(() => ({
        total: this.actividades().length,
        disponibles: this.actividades().filter(a =>
            a.cupo_maximo === 0 || a.voluntarios_inscritos < a.cupo_maximo
        ).length,
        inscritas: this.actividades().filter(a => a.inscrito).length
    }));

    ngOnInit() {
        // Los datos ya se cargan automáticamente desde el servicio
        // pero podemos forzar una recarga si es necesario
        if (this.actividades().length === 0) {
            this.voluntarioService.cargarTodo();
        }
    }

    limpiarFiltros() {
        this.busqueda.set('');
        this.filtroTipo.set('Todos');
        this.filtroUbicacion.set('Todas');
        this.soloDisponibles.set(true);
    }

    abrirModal(actividad: ActividadDisponible) {
        this.actividadSeleccionada.set(actividad);
        this.modalAbierto.set(true);
        this.mensaje.set(null);
    }

    cerrarModal() {
        this.modalAbierto.set(false);
        this.actividadSeleccionada.set(null);
        this.mensaje.set(null);
    }

    inscribirse(actividad: ActividadDisponible) {
        this.procesando.set(true);
        this.mensaje.set(null);

        this.voluntarioService.inscribirse(actividad.id_actividad).subscribe({
            next: (result) => {
                if (result.success) {
                    this.mensaje.set({ tipo: 'success', texto: '¡Te has inscrito correctamente! Tu solicitud está pendiente de aprobación.' });
                    // Cerrar modal después de 2 segundos
                    setTimeout(() => this.cerrarModal(), 2000);
                } else {
                    this.mensaje.set({ tipo: 'error', texto: result.mensaje });
                }
                this.procesando.set(false);
            },
            error: () => {
                this.mensaje.set({ tipo: 'error', texto: 'Error al inscribirse. Intenta de nuevo.' });
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

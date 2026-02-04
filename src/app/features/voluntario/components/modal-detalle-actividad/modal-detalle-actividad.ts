import { Component, input, output, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoluntarioService, ActividadDisponible } from '../../services/voluntario.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-modal-detalle-actividad',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './modal-detalle-actividad.html',
})
export class ModalDetalleActividad implements OnInit {
    private voluntarioService = inject(VoluntarioService);

    baseUrl = `${environment.apiUrl}/uploads/actividades/`;
    odsUrl = `${environment.apiUrl}/uploads/ods/`;

    actividad = input.required<ActividadDisponible>();

    getOdsImagen(id: number): string {
        return `${this.odsUrl}${id < 10 ? '0' + id : id}.jpg`;
    }
    close = output<void>();
    estadoCambiado = output<void>(); // Emite cuando cambia la inscripción

    act = signal<ActividadDisponible | null>(null);
    cargandoDetalle = signal(true);
    procesando = signal(false);
    mensaje = signal<{ tipo: 'success' | 'error'; texto: string } | null>(null);

    constructor() {
        effect(() => {
            // Al recibir la actividad inicial, la seteamos y cargamos detalles
            const inicial = this.actividad();
            if (inicial) {
                // Iniciar con datos básicos
                this.act.set(inicial);
                this.cargarDetalle(inicial.id_actividad);
            }
        }, { allowSignalWrites: true });
    }

    ngOnInit() {
        // El effect se encarga
    }

    cargarDetalle(id: number) {
        this.cargandoDetalle.set(true);
        this.voluntarioService.getDetalleActividad(id).subscribe({
            next: (detalleCompleto) => {
                if (detalleCompleto) {
                    const actual = this.act();
                    // Preservar estado de inscripción si el detalle no lo tiene (o si queremos el más fresco, el detalle debería traerlo,
                    // pero getDetalleActividad en el servicio trata de combinarlo con la lista local. Confiemos en el servicio)

                    if (actual && detalleCompleto) {
                        // Asegurar que usamos la imagen si falta
                        if (!detalleCompleto.imagen && actual.imagen) {
                            detalleCompleto.imagen = actual.imagen;
                        }

                        // Preservar estado de inscripción si ya lo sabíamos (crítico para cuando venimos de Inicio)
                        if (actual.inscrito) {
                            detalleCompleto.inscrito = true;
                            detalleCompleto.estadoInscripcion = actual.estadoInscripcion;
                        } else if (actual.estadoInscripcion && !detalleCompleto.estadoInscripcion) {
                            // Caso borde: tenemos estado pero quizas inscrito es false?
                            detalleCompleto.estadoInscripcion = actual.estadoInscripcion;
                        }

                        this.act.set(detalleCompleto);
                    }
                }
                this.cargandoDetalle.set(false);
            },
            error: () => {
                this.cargandoDetalle.set(false);
            }
        });
    }

    inscribirse() {
        const actividad = this.act();
        if (!actividad) return;

        this.procesando.set(true);
        this.mensaje.set(null);

        this.voluntarioService.inscribirse(actividad.id_actividad).subscribe({
            next: (result) => {
                const yaInscrito = !result.success && (
                    (result.mensaje && (result.mensaje.includes('409') || result.mensaje.toLowerCase().includes('conflict') || result.mensaje.toLowerCase().includes('ya est')))
                );

                if (result.success || yaInscrito) {
                    const texto = yaInscrito
                        ? 'Ya estabas inscrito. Estado actualizado.'
                        : '¡Inscripción solicitada correctamente!';

                    this.mensaje.set({ tipo: 'success', texto });

                    // Actualizar estado local
                    this.act.update(a => a ? ({ ...a, inscrito: true, estadoInscripcion: 'Pendiente' }) : null);

                    // Notificar cambio
                    this.estadoCambiado.emit();

                    // Cerrar en breve
                    setTimeout(() => this.close.emit(), 2000);
                } else {
                    this.mensaje.set({ tipo: 'error', texto: result.mensaje });
                }
                this.procesando.set(false);
            },
            error: () => {
                this.mensaje.set({ tipo: 'error', texto: 'Error al procesar la inscripción.' });
                this.procesando.set(false);
            }
        });
    }

    desapuntarse() {
        const actividad = this.act();
        if (!actividad) return;

        if (!confirm('¿Seguro que quieres desapuntarte?')) return;

        this.procesando.set(true);
        this.mensaje.set(null);

        this.voluntarioService.desapuntarse(actividad.id_actividad).subscribe({
            next: (result) => {
                const yaEliminado = !result.success && (
                    (result.mensaje && (result.mensaje.includes('404') || result.mensaje.toLowerCase().includes('not found') || result.mensaje.toLowerCase().includes('no encontrada')))
                );

                if (result.success || yaEliminado) {
                    this.mensaje.set({ tipo: 'success', texto: 'Te has desapuntado correctamente.' });

                    this.act.update(a => a ? ({ ...a, inscrito: false, estadoInscripcion: null }) : null);

                    this.estadoCambiado.emit();

                    setTimeout(() => this.close.emit(), 1500);
                } else {
                    this.mensaje.set({ tipo: 'error', texto: result.mensaje });
                }
                this.procesando.set(false);
            },
            error: () => {
                this.mensaje.set({ tipo: 'error', texto: 'Error al desapuntarse.' });
                this.procesando.set(false);
            }
        });
    }

    // Helpers de vista
    getPlazasTexto(): string {
        const act = this.act();
        if (!act) return '';
        if (act.cupo_maximo === 0) return 'Sin límite';
        const disponibles = act.cupo_maximo - act.voluntarios_inscritos;
        return `${disponibles} de ${act.cupo_maximo} plazas`;
    }

    getPlazasPorcentaje(): number {
        const act = this.act();
        if (!act || act.cupo_maximo === 0) return 0;
        return (act.voluntarios_inscritos / act.cupo_maximo) * 100;
    }

    estaLlena(): boolean {
        const act = this.act();
        if (!act) return false;
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
}

import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CoordinadorService, InscripcionPendiente } from '../../../services/coordinador';
import { ModalDetalleInscripcion } from '../../../components/modal-detalle-inscripcion/modal-detalle-inscripcion';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
    selector: 'app-aprob-inscripciones',
    standalone: true,
    imports: [CommonModule, RouterModule, ModalDetalleInscripcion],
    templateUrl: './aprob-inscripciones.html',
})
export class AprobInscripciones implements OnInit {

    private coordinadorService = inject(CoordinadorService);
    private toastService = inject(ToastService);

    solicitudes = signal<InscripcionPendiente[]>([]);
    cargando = signal(true);
    procesando = signal<string | null>(null);

    // Contadores para tabs
    countOrganizaciones = signal(0);
    countVoluntarios = signal(0);
    countActividades = signal(0);
    countInscripciones = signal(0);

    // Modal de detalle
    inscripcionSeleccionada = signal<InscripcionPendiente | null>(null);

    ngOnInit() {
        this.cargarDatos();
    }

    cargarDatos() {
        this.cargando.set(true);

        this.coordinadorService.getInscripcionesPendientes().subscribe({
            next: (data) => {
                this.solicitudes.set(data);
                this.countInscripciones.set(data.length);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
            }
        });

        this.coordinadorService.getSolicitudesOrganizaciones().subscribe(data => {
            this.countOrganizaciones.set(data.length);
        });

        this.coordinadorService.getSolicitudesVoluntarios().subscribe(data => {
            this.countVoluntarios.set(data.length);
        });

        this.coordinadorService.getSolicitudesActividades().subscribe(data => {
            this.countActividades.set(data.length);
        });
    }

    verDetalle(inscripcion: InscripcionPendiente) {
        this.inscripcionSeleccionada.set(inscripcion);
    }

    cerrarDetalle() {
        this.inscripcionSeleccionada.set(null);
    }

    aprobar(inscripcion: InscripcionPendiente, event?: Event) {
        event?.stopPropagation();
        const key = `${inscripcion.id_actividad}-${inscripcion.id_voluntario}`;

        if (confirm(`¿Aprobar la inscripción de ${inscripcion.nombre_voluntario} en "${inscripcion.titulo_actividad}"?`)) {
            this.procesando.set(key);
            this.coordinadorService.aprobarInscripcion(inscripcion.id_actividad, inscripcion.id_voluntario).subscribe({
                next: () => {
                    this.procesando.set(null);
                    this.toastService.success(`Inscripción de ${inscripcion.nombre_voluntario} aprobada`);
                    this.cerrarDetalle();
                    this.cargarDatos();
                },
                error: (err: any) => {
                    this.procesando.set(null);
                    this.toastService.error(err.error?.error || 'No se pudo aprobar la inscripción');
                }
            });
        }
    }

    rechazar(inscripcion: InscripcionPendiente, event?: Event) {
        event?.stopPropagation();
        const key = `${inscripcion.id_actividad}-${inscripcion.id_voluntario}`;

        if (confirm(`¿Rechazar la inscripción de ${inscripcion.nombre_voluntario}?`)) {
            this.procesando.set(key);
            this.coordinadorService.rechazarInscripcion(inscripcion.id_actividad, inscripcion.id_voluntario).subscribe({
                next: () => {
                    this.procesando.set(null);
                    this.toastService.info(`Inscripción de ${inscripcion.nombre_voluntario} rechazada`);
                    this.cerrarDetalle();
                    this.cargarDatos();
                },
                error: (err: any) => {
                    this.procesando.set(null);
                    this.toastService.error(err.error?.error || 'No se pudo rechazar la inscripción');
                }
            });
        }
    }

    aprobarDesdeModal() {
        const ins = this.inscripcionSeleccionada();
        if (ins) this.aprobar(ins);
    }

    rechazarDesdeModal() {
        const ins = this.inscripcionSeleccionada();
        if (ins) this.rechazar(ins);
    }

    isProcesando(inscripcion: InscripcionPendiente): boolean {
        return this.procesando() === `${inscripcion.id_actividad}-${inscripcion.id_voluntario}`;
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

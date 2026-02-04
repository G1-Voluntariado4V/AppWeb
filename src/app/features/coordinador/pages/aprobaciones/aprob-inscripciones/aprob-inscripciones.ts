import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CoordinadorService, InscripcionPendiente } from '../../../services/coordinador';
import { ModalDetalleInscripcion } from '../../../components/modal-detalle-inscripcion/modal-detalle-inscripcion';
import { ToastService } from '../../../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal';

@Component({
    selector: 'app-aprob-inscripciones',
    standalone: true,
    imports: [CommonModule, RouterModule, ModalDetalleInscripcion, ConfirmModalComponent],
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

    // Modal de confirmación
    confirmModalVisible = signal(false);
    confirmModalTitle = signal('');
    confirmModalMessage = signal('');
    confirmModalButtonText = signal('Confirmar');
    confirmModalAction = signal<(() => void) | null>(null);

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

        this.showConfirmModal(
            `¿Aprobar inscripción?`,
            `Se aprobará la inscripción de ${inscripcion.nombre_voluntario} en "${inscripcion.titulo_actividad}".`,
            'Aprobar',
            () => {
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
        );
    }

    rechazar(inscripcion: InscripcionPendiente, event?: Event) {
        event?.stopPropagation();
        const key = `${inscripcion.id_actividad}-${inscripcion.id_voluntario}`;

        this.showConfirmModal(
            `¿Rechazar inscripción?`,
            `Se rechazará la inscripción de ${inscripcion.nombre_voluntario}.`,
            'Rechazar',
            () => {
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
        );
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

    // Modal de confirmación
    showConfirmModal(title: string, message: string, buttonText: string, action: () => void) {
        this.confirmModalTitle.set(title);
        this.confirmModalMessage.set(message);
        this.confirmModalButtonText.set(buttonText);
        this.confirmModalAction.set(action);
        this.confirmModalVisible.set(true);
    }

    onConfirmModalConfirm() {
        const action = this.confirmModalAction();
        if (action) action();
        this.confirmModalVisible.set(false);
    }

    onConfirmModalCancel() {
        this.confirmModalVisible.set(false);
    }
}

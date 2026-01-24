import { Component, input, output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizacionService, VoluntarioInscrito } from '../../services/organizacion.service';

import { ModalDetalleVoluntarioComponent } from '../modal-detalle-voluntario/modal-detalle-voluntario';

@Component({
    selector: 'app-modal-voluntarios',
    standalone: true,
    imports: [CommonModule, ModalDetalleVoluntarioComponent],
    templateUrl: './modal-voluntarios.html',
})
export class ModalVoluntariosComponent implements OnInit {

    actividadId = input.required<number>();
    actividadTitulo = input.required<string>();
    close = output<void>();

    private orgService = inject(OrganizacionService);

    voluntarios = signal<VoluntarioInscrito[]>([]);
    cargando = signal(true);
    seleccionado = signal<VoluntarioInscrito | null>(null);
    procesando = signal<number | null>(null); // ID del voluntario que se está procesando

    ngOnInit() {
        this.cargarVoluntarios();
    }

    cargarVoluntarios() {
        this.cargando.set(true);
        this.orgService.obtenerVoluntariosActividad(this.actividadId())
            .subscribe({
                next: (data) => {
                    this.voluntarios.set(data);
                    this.cargando.set(false);
                },
                error: (err) => {
                    console.error('Error cargando voluntarios', err);
                    this.cargando.set(false);
                }
            });
    }

    // Aceptar voluntario
    aceptarVoluntario(vol: VoluntarioInscrito, event: Event) {
        event.stopPropagation(); // Evitar que se abra el modal de detalle
        if (this.procesando()) return;

        this.procesando.set(vol.id_voluntario);
        this.orgService.gestionarInscripcion(this.actividadId(), vol.id_voluntario, 'Aceptada')
            .subscribe({
                next: () => {
                    // Actualizar el estado localmente
                    this.voluntarios.update(list =>
                        list.map(v => v.id_voluntario === vol.id_voluntario
                            ? { ...v, estado_solicitud: 'Aceptada' as const }
                            : v
                        )
                    );
                    this.procesando.set(null);
                },
                error: (err) => {
                    console.error('Error aceptando voluntario', err);
                    this.procesando.set(null);
                }
            });
    }

    // Rechazar voluntario
    rechazarVoluntario(vol: VoluntarioInscrito, event: Event) {
        event.stopPropagation();
        if (this.procesando()) return;

        this.procesando.set(vol.id_voluntario);
        this.orgService.gestionarInscripcion(this.actividadId(), vol.id_voluntario, 'Rechazada')
            .subscribe({
                next: () => {
                    this.voluntarios.update(list =>
                        list.map(v => v.id_voluntario === vol.id_voluntario
                            ? { ...v, estado_solicitud: 'Rechazada' as const }
                            : v
                        )
                    );
                    this.procesando.set(null);
                },
                error: (err) => {
                    console.error('Error rechazando voluntario', err);
                    this.procesando.set(null);
                }
            });
    }

    // Volver a pendiente (para revertir)
    volverPendiente(vol: VoluntarioInscrito, event: Event) {
        event.stopPropagation();
        if (this.procesando()) return;

        this.procesando.set(vol.id_voluntario);
        this.orgService.gestionarInscripcion(this.actividadId(), vol.id_voluntario, 'Pendiente')
            .subscribe({
                next: () => {
                    this.voluntarios.update(list =>
                        list.map(v => v.id_voluntario === vol.id_voluntario
                            ? { ...v, estado_solicitud: 'Pendiente' as const }
                            : v
                        )
                    );
                    this.procesando.set(null);
                },
                error: (err) => {
                    console.error('Error revirtiendo estado', err);
                    this.procesando.set(null);
                }
            });
    }

    formatearFecha(fecha: string): string {
        if (!fecha) return '';
        const d = new Date(fecha);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }
}

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

    formatearFecha(fecha: string): string {
        if (!fecha) return '';
        const d = new Date(fecha);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }
}

import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizacionService, VoluntarioInscrito } from '../../services/organizacion.service';

@Component({
    selector: 'app-modal-detalle-voluntario',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './modal-detalle-voluntario.html',
})
export class ModalDetalleVoluntarioComponent {

    vol = input.required<VoluntarioInscrito>();
    actividadId = input.required<number>();
    close = output<void>();
    cursoCambiado = output<void>(); // Evento para recargar lista

    private orgService = inject(OrganizacionService);
    procesando = signal(false);

    gestionar(estado: 'Aceptada' | 'Rechazada') {
        if (this.procesando()) return;
        this.procesando.set(true);

        this.orgService.gestionarInscripcion(this.actividadId(), this.vol().id_voluntario, estado)
            .subscribe({
                next: () => {
                    this.procesando.set(false);
                    this.cursoCambiado.emit();
                    this.close.emit();
                },
                error: (err) => {
                    console.error('Error gestionando inscripción', err);
                    this.procesando.set(false);
                    alert('Hubo un error al procesar la solicitud. Verifica el cupo o intenta más tarde.');
                }
            });
    }

    formatearFecha(fecha?: string): string {
        if (!fecha) return 'No definida';
        try {
            const d = new Date(fecha);
            return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return fecha;
        }
    }
}

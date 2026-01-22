import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinadorService } from '../../services/coordinador';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
    selector: 'app-modal-participantes',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './modal-participantes.html',
})
export class ModalParticipantes implements OnInit {
    private coordinadorService = inject(CoordinadorService);
    private toastService = inject(ToastService);

    actividadId = input.required<number>();
    nombreActividad = input.required<string>();
    close = output<void>();

    participantes = signal<any[]>([]);
    cargando = signal(true);

    ngOnInit() {
        this.cargarParticipantes();
    }

    cargarParticipantes() {
        this.cargando.set(true);
        this.coordinadorService.getParticipantesActividad(this.actividadId()).subscribe({
            next: (data) => {
                this.participantes.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.toastService.error('Error al cargar participantes');
                this.cargando.set(false);
            }
        });
    }

    cerrar() {
        this.close.emit();
    }

    getEstadoClase(estado: string): string {
        const clases: Record<string, string> = {
            'Aceptada': 'bg-green-50 text-green-600 border-green-100',
            'Pendiente': 'bg-orange-50 text-orange-600 border-orange-100',
            'Rechazada': 'bg-red-50 text-red-600 border-red-100',
            'Finalizada': 'bg-blue-50 text-blue-600 border-blue-100',
            'Cancelada': 'bg-gray-50 text-gray-500 border-gray-100'
        };
        return clases[estado] || 'bg-gray-50 text-gray-500 border-gray-100';
    }
}

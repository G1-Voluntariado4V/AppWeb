import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, VoluntarioAdmin } from '../../services/coordinador';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-modal-detalle-voluntario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-detalle-voluntario.html',
})
export class ModalDetalleVoluntario implements OnInit {
  private coordinadorService = inject(CoordinadorService);
  private toastService = inject(ToastService);

  vol = input.required<VoluntarioAdmin>();
  close = output<void>();
  updated = output<void>();

  // Estado de edición
  editando = signal(false);
  guardando = signal(false);

  // Datos reales del backend
  historial = signal<any[]>([]);
  horasTotales = signal(0);
  actividadesCount = signal(0);
  cargandoHistorial = signal(true);

  // Datos editables
  nombreEditable = '';
  apellidosEditable = '';
  telefonoEditable = '';
  descripcionEditable = '';

  ngOnInit() {
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.cargandoHistorial.set(true);
    this.coordinadorService.getHistorialVoluntario(this.vol().id).subscribe({
      next: (data) => {
        this.historial.set(data.actividades || []);
        this.horasTotales.set(data.resumen?.horas_acumuladas || 0);
        this.actividadesCount.set(data.resumen?.total_participaciones || 0);
        this.cargandoHistorial.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar historial');
        this.cargandoHistorial.set(false);
      }
    });
  }

  cerrar() {
    this.editando.set(false);
    this.close.emit();
  }

  iniciarEdicion() {
    const v = this.vol();
    // Separar nombre y apellidos si están juntos
    const partes = v.nombre.split(' ');
    if (v.apellidos) {
      this.nombreEditable = v.nombre;
      this.apellidosEditable = v.apellidos;
    } else if (partes.length > 1) {
      this.nombreEditable = partes[0];
      this.apellidosEditable = partes.slice(1).join(' ');
    } else {
      this.nombreEditable = v.nombre;
      this.apellidosEditable = '';
    }
    this.telefonoEditable = v.telefono || '';
    this.descripcionEditable = '';
    this.editando.set(true);
  }

  cancelarEdicion() {
    this.editando.set(false);
  }

  guardarCambios() {
    if (!this.nombreEditable.trim() || !this.apellidosEditable.trim()) {
      this.toastService.error('El nombre y apellidos son obligatorios');
      return;
    }

    this.guardando.set(true);

    this.coordinadorService.editarVoluntario(this.vol().id, {
      nombre: this.nombreEditable.trim(),
      apellidos: this.apellidosEditable.trim(),
      telefono: this.telefonoEditable.trim() || undefined,
      descripcion: this.descripcionEditable.trim() || undefined
    }).subscribe({
      next: () => {
        this.toastService.success('Voluntario actualizado correctamente');
        this.guardando.set(false);
        this.editando.set(false);
        this.updated.emit();
      },
      error: (err: any) => {
        this.toastService.error('Error: ' + (err.error?.error || 'Error al guardar'));
        this.guardando.set(false);
      }
    });
  }

  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      'Aceptada': 'bg-green-100 text-green-700',
      'Pendiente': 'bg-orange-100 text-orange-700',
      'Rechazada': 'bg-red-100 text-red-700',
      'Finalizada': 'bg-blue-100 text-blue-700',
      'Cancelada': 'bg-gray-100 text-gray-700'
    };
    return clases[estado] || 'bg-gray-100 text-gray-700';
  }
}
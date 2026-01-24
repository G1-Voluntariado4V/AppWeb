import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, OrganizacionAdmin, ActividadAdmin } from '../../services/coordinador.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalDetalleActividad } from '../modal-detalle-actividad/modal-detalle-actividad';

@Component({
  selector: 'app-modal-detalle-organizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalDetalleActividad],
  templateUrl: './modal-detalle-organizacion.html',
})
export class ModalDetalleOrganizacion {
  private coordinadorService = inject(CoordinadorService);
  private toastService = inject(ToastService);

  org = input.required<OrganizacionAdmin>();
  close = output<void>();
  updated = output<void>();

  // Estado de edición
  editando = signal(false);
  guardando = signal(false);

  // Datos editables
  nombreEditable = '';
  descripcionEditable = '';
  telefonoEditable = '';
  direccionEditable = '';
  sitioWebEditable = '';

  // Actividades
  actividades = signal<ActividadAdmin[]>([]);
  cargandoActividades = signal(false);
  actividadSeleccionada = signal<ActividadAdmin | null>(null);

  ngOnInit() {
    this.cargarActividades();
  }

  cargarActividades() {
    this.cargandoActividades.set(true);
    this.coordinadorService.getActividadesDeOrganizacion(this.org().id).subscribe({
      next: (acts) => {
        this.actividades.set(acts);
        this.cargandoActividades.set(false);
      },
      error: () => {
        this.cargandoActividades.set(false);
      }
    });
  }

  verActividad(act: ActividadAdmin) {
    this.actividadSeleccionada.set(act);
  }

  cerrarModalActividad() {
    this.actividadSeleccionada.set(null);
  }

  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      'Activa': 'bg-green-100 text-green-700',
      'Pendiente': 'bg-orange-100 text-orange-700',
      'Bloqueada': 'bg-red-100 text-red-700',
      'Rechazada': 'bg-gray-100 text-gray-600'
    };
    return clases[estado] || 'bg-gray-100 text-gray-600';
  }

  cerrar() {
    this.editando.set(false);
    this.close.emit();
  }

  iniciarEdicion() {
    const o = this.org();
    this.nombreEditable = o.nombre;
    this.descripcionEditable = o.descripcion || '';
    this.telefonoEditable = o.telefono || '';
    this.direccionEditable = o.direccion || '';
    this.sitioWebEditable = o.sitioWeb || '';
    this.editando.set(true);
  }

  cancelarEdicion() {
    this.editando.set(false);
  }

  guardarCambios() {
    if (!this.nombreEditable.trim()) {
      this.toastService.error('El nombre de la organización es obligatorio');
      return;
    }

    this.guardando.set(true);

    this.coordinadorService.editarOrganizacion(this.org().id, {
      nombre: this.nombreEditable.trim(),
      descripcion: this.descripcionEditable.trim() || undefined,
      telefono: this.telefonoEditable.trim() || undefined,
      direccion: this.direccionEditable.trim() || undefined,
      sitioWeb: this.sitioWebEditable.trim() || undefined
    }).subscribe({
      next: () => {
        this.toastService.success('Organización actualizada correctamente');
        this.guardando.set(false);
        this.editando.set(false);
        this.updated.emit();
      },
      error: (err: any) => {
        this.toastService.error('Error: ' + (err.error?.error || err.error?.detail || 'Error al guardar'));
        this.guardando.set(false);
      }
    });
  }
}
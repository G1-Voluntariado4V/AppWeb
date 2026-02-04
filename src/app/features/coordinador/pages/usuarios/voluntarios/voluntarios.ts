import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, VoluntarioAdmin } from '../../../services/coordinador';
import { ModalDetalleVoluntario } from '../../../components/modal-detalle-voluntario/modal-detalle-voluntario';

import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-voluntarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalDetalleVoluntario, ConfirmModalComponent],
  templateUrl: './voluntarios.html',
})
export class Voluntarios implements OnInit {

  private coordinadorService = inject(CoordinadorService);
  private toastService = inject(ToastService);

  voluntarios = signal<VoluntarioAdmin[]>([]);
  busqueda = signal('');
  cargando = signal(true);

  // Filtros
  filtroEstado = signal('Todos');
  menuFiltroAbierto = signal(false);

  // Menú de acciones por fila
  menuAccionesAbiertoId = signal<number | null>(null);

  // Estados disponibles
  estadosDisponibles = ['Todos', 'Activa', 'Pendiente', 'Bloqueada', 'Rechazada'];

  // Modal de detalle
  voluntarioSeleccionado = signal<VoluntarioAdmin | null>(null);

  // Confirm Modal State
  confirmModalOpen = signal(false);
  confirmModalTitle = signal('');
  confirmModalMessage = signal('');
  pendingConfirmAction: (() => void) | null = null;
  pendingConfirmText = signal('Confirmar');

  // Filtrado
  voluntariosFiltrados = computed(() => {
    const term = this.busqueda().toLowerCase();
    const estado = this.filtroEstado();

    return this.voluntarios().filter(vol => {
      const matchTexto = vol.nombre.toLowerCase().includes(term) ||
        vol.email.toLowerCase().includes(term) ||
        (vol.dni?.toLowerCase().includes(term) ?? false);
      const matchEstado = estado === 'Todos' || vol.estado === estado;
      return matchTexto && matchEstado;
    });
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando.set(true);
    this.coordinadorService.getVoluntarios(true).subscribe({
      next: (data) => {
        this.voluntarios.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  // Filtros
  toggleFiltro() {
    this.menuFiltroAbierto.update(v => !v);
  }

  seleccionarFiltro(estado: string) {
    this.filtroEstado.set(estado);
    this.menuFiltroAbierto.set(false);
  }

  // Menú de acciones
  toggleMenuAcciones(id: number, event: Event) {
    event.stopPropagation();
    this.menuAccionesAbiertoId.update(currentId => currentId === id ? null : id);
  }

  cerrarMenuAcciones() {
    this.menuAccionesAbiertoId.set(null);
  }

  // Acciones
  // Acciones
  activar(vol: VoluntarioAdmin, event: Event) {
    event.stopPropagation();
    this.openConfirmModal(
      'Activar cuenta',
      `¿Activar cuenta de ${vol.nombre}?`,
      'Activar',
      () => {
        this.coordinadorService.cambiarEstadoUsuario(vol.id, 'voluntarios', 'Activa').subscribe({
          next: () => {
            this.cargarDatos();
            this.cerrarMenuAcciones();
          },
          error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
        });
      }
    );
  }

  bloquear(vol: VoluntarioAdmin, event: Event) {
    event.stopPropagation();
    this.openConfirmModal(
      'Bloquear cuenta',
      `¿Bloquear cuenta de ${vol.nombre}?`,
      'Bloquear',
      () => {
        this.coordinadorService.bloquearUsuario(vol.id, 'voluntarios').subscribe({
          next: () => {
            this.cargarDatos();
            this.cerrarMenuAcciones();
          },
          error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
        });
      }
    );
  }

  rechazar(vol: VoluntarioAdmin, event: Event) {
    event.stopPropagation();
    this.openConfirmModal(
      'Rechazar cuenta',
      `¿Rechazar cuenta de ${vol.nombre}?`,
      'Rechazar',
      () => {
        this.coordinadorService.rechazarVoluntario(vol.id).subscribe({
          next: () => {
            this.cargarDatos();
            this.cerrarMenuAcciones();
          },
          error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
        });
      }
    );
  }

  eliminar(vol: VoluntarioAdmin, event: Event) {
    event.stopPropagation();
    this.openConfirmModal(
      'Eliminar usuario',
      `¿Eliminar permanentemente a ${vol.nombre}? Esta acción no se puede deshacer.`,
      'Eliminar',
      () => {
        this.coordinadorService.eliminarUsuario(vol.id).subscribe({
          next: () => {
            this.cargarDatos();
            this.cerrarMenuAcciones();
          },
          error: (err: any) => this.toastService.error('Error: ' + (err.error?.error || 'Error desconocido'))
        });
      }
    );
  }

  // Confirm Modal Helpers
  openConfirmModal(title: string, message: string, confirmText: string, action: () => void) {
    this.confirmModalTitle.set(title);
    this.confirmModalMessage.set(message);
    this.pendingConfirmText.set(confirmText);
    this.pendingConfirmAction = action;
    this.confirmModalOpen.set(true);
  }

  onConfirmModal() {
    if (this.pendingConfirmAction) {
      this.pendingConfirmAction();
    }
    this.closeConfirmModal();
  }

  closeConfirmModal() {
    this.confirmModalOpen.set(false);
    this.pendingConfirmAction = null;
  }

  // Detalle
  verDetalle(vol: VoluntarioAdmin) {
    this.voluntarioSeleccionado.set(vol);
  }

  cerrarDetalle() {
    this.voluntarioSeleccionado.set(null);
  }

  onVoluntarioActualizado() {
    this.cargarDatos();
    this.cerrarDetalle();
  }

  // Helpers
  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      'Activa': 'bg-green-50 text-green-600',
      'Pendiente': 'bg-orange-50 text-orange-600',
      'Bloqueada': 'bg-red-50 text-red-600',
      'Rechazada': 'bg-gray-100 text-gray-500'
    };
    return clases[estado] || 'bg-gray-100 text-gray-500';
  }
}

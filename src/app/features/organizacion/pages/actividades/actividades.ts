import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService, ActividadOrg } from '../../services/organizacion.service';
import { ModalCrearActividad } from '../../components/modal-crear-actividad/modal-crear-actividad';
import { ModalDetalleActividad } from '../../components/modal-detalle-actividad/modal-detalle-actividad';

@Component({
  selector: 'app-actividades-org',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCrearActividad, ModalDetalleActividad],
  templateUrl: './actividades.html',
})
export class Actividades {
  
  private orgService = inject(OrganizacionService);

  // Enlazamos directamente a la señal del servicio
  actividades = this.orgService.actividades;

  busqueda = signal('');
  filtroEstado = signal('Todos');
  menuFiltroAbierto = signal(false);

  // Modales
  modalCrearVisible = signal(false);
  actividadSeleccionada = signal<ActividadOrg | null>(null);

  // --- FILTROS ---
  actividadesFiltradas = computed(() => {
    const term = this.busqueda().toLowerCase();
    const estado = this.filtroEstado();

    return this.actividades().filter(act => {
      const matchTexto = act.nombre.toLowerCase().includes(term);
      const matchEstado = estado === 'Todos' || act.estado === estado;
      return matchTexto && matchEstado;
    });
  });

  toggleFiltro() { this.menuFiltroAbierto.update(v => !v); }
  seleccionarFiltro(estado: string) {
    this.filtroEstado.set(estado);
    this.menuFiltroAbierto.set(false);
  }

  // --- ACCIONES ---
  abrirCrear() { this.modalCrearVisible.set(true); }
  cerrarCrear() { this.modalCrearVisible.set(false); }

  guardarActividad(datos: any) {
    const nueva: ActividadOrg = {
      id: Date.now(),
      nombre: datos.nombre,
      tipo: datos.tipoVoluntariado || 'Social',
      fecha: datos.fecha,
      estado: 'Pendiente', // <--- CAMBIO: Ahora nace como Pendiente
      voluntariosInscritos: 0,
      cupoMaximo: datos.cupoMaximo || 10,
      descripcion: datos.descripcion,
      ubicacion: 'Sede Principal',
      duracionHoras: 2 // Valor por defecto si no viene del modal
    };
    
    this.orgService.crearActividad(nueva);
    alert('Actividad enviada a revisión (Estado: Pendiente)');
  }

  verDetalle(act: ActividadOrg) { this.actividadSeleccionada.set(act); }
  cerrarDetalle() { this.actividadSeleccionada.set(null); }
}
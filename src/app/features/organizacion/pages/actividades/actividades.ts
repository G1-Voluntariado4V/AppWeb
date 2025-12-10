import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService, ActividadOrg } from '../../services/organizacion.service';
// Importamos los componentes (Modales) específicos de Organización
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

  // Datos
  // Usamos el observable y lo convertimos a signal o nos suscribimos (aquí uso AsyncPipe en el HTML mejor para listas vivas, 
  // pero para filtrar fácil en local, vamos a suscribirnos y guardar en signal como hicimos antes)
  actividades = signal<ActividadOrg[]>([]);
  busqueda = signal('');
  filtroEstado = signal('Todos');
  menuFiltroAbierto = signal(false);

  // Modales
  modalCrearVisible = signal(false);
  actividadSeleccionada = signal<ActividadOrg | null>(null);

  constructor() {
    // Cargar datos al iniciar
    this.orgService.getActividades().subscribe(data => this.actividades.set(data));
  }

  // --- FILTROS ---
  actividadesFiltradas = computed(() => {
    const term = this.busqueda().toLowerCase();
    const estado = this.filtroEstado();

    return this.actividades().filter(act => {
      const matchTexto = act.nombre.toLowerCase().includes(term); // Solo buscamos por nombre (no hay organizador externo)
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
    // Construimos el objeto
    const nueva: ActividadOrg = {
      id: Date.now(),
      nombre: datos.nombre,
      tipo: datos.tipoVoluntariado || 'Social',
      fecha: datos.fecha,
      estado: 'Activa', // O 'Pendiente' si quieres simular aprobación
      voluntariosInscritos: 0,
      cupoMaximo: datos.cupoMaximo || 10,
      descripcion: datos.descripcion,
      ubicacion: 'Sede Principal' // Dato simulado
    };
    
    this.orgService.crearActividad(nueva);
    // Actualizamos la lista local
    this.orgService.getActividades().subscribe(data => this.actividades.set(data));
    alert('Actividad creada con éxito');
  }

  verDetalle(act: ActividadOrg) { this.actividadSeleccionada.set(act); }
  cerrarDetalle() { this.actividadSeleccionada.set(null); }
}

import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importamos Servicio e Interfaz
import { CoordinadorService, ActividadAdmin } from '../../services/coordinador';
// Importamos AMBOS modales
import { ModalCrearActividad } from '../../components/modal-crear-actividad/modal-crear-actividad';
import { ModalDetalleActividad } from '../../components/modal-detalle-actividad/modal-detalle-actividad';

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCrearActividad, ModalDetalleActividad],
  templateUrl: './actividades.html',
})
export class Actividades implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  actividades = signal<ActividadAdmin[]>([]);
  busqueda = signal('');
  
  // --- NUEVO: Lógica de Filtros ---
  filtroEstado = signal('Todos');
  menuFiltroAbierto = signal(false);

  // Signals para controlar los modales
  modalCrearVisible = signal(false);
  actividadSeleccionada = signal<ActividadAdmin | null>(null);

  // --- COMPUTED ACTUALIZADO (Texto + Estado) ---
  actividadesFiltradas = computed(() => {
    const term = this.busqueda().toLowerCase();
    const estado = this.filtroEstado();

    return this.actividades().filter(act => {
      // 1. Coincide con texto? (Nombre u Organizador)
      const matchTexto = act.nombre.toLowerCase().includes(term) || 
                         act.organizador.toLowerCase().includes(term);
      
      // 2. Coincide con estado? (Si es 'Todos', pasa siempre)
      const matchEstado = estado === 'Todos' || act.estado === estado;

      return matchTexto && matchEstado;
    });
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.coordinadorService.getActividadesAdmin().subscribe(data => {
      this.actividades.set(data);
    });
  }

  // --- MÉTODOS FILTRO ---
  toggleFiltro() {
    this.menuFiltroAbierto.update(v => !v);
  }

  seleccionarFiltro(estado: string) {
    this.filtroEstado.set(estado);
    this.menuFiltroAbierto.set(false); // Cerrar al elegir
  }

  // --- MÉTODOS DEL MODAL CREAR ---
  abrirModalCrear() { this.modalCrearVisible.set(true); }
  cerrarModalCrear() { this.modalCrearVisible.set(false); }

  guardarNuevaActividad(datos: any) {
    const nuevaAct: ActividadAdmin = {
      id: Date.now(),
      nombre: datos.nombre,
      tipo: datos.tipo,
      organizador: datos.organizador,
      fecha: datos.fecha,
      estado: 'Active', 
      duracionHoras: datos.duracionHoras,
      cupoMaximo: datos.cupoMaximo,
      ubicacion: datos.ubicacion,
      descripcion: datos.descripcion
    };
    this.coordinadorService.addActividad(nuevaAct);
    this.cargarDatos();
    alert('Actividad creada y estadísticas actualizadas.');
  }

  // --- MÉTODOS DEL MODAL DETALLE ---
  verDetalle(act: ActividadAdmin) { this.actividadSeleccionada.set(act); }
  cerrarDetalle() { this.actividadSeleccionada.set(null); }

  editar(id: number, event: Event) {
    event.stopPropagation();
    console.log('Editar actividad', id);
  }
}
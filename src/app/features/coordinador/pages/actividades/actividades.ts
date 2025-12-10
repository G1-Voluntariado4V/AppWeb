import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importamos Servicio e Interfaz
import { CoordinadorService, ActividadAdmin } from '../../services/coordinador';
// Importamos AMBOS modales (Crear y Detalle)
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
  
  // Signals para controlar los modales
  modalCrearVisible = signal(false);
  
  // Signal para el detalle (guarda la actividad seleccionada o null)
  actividadSeleccionada = signal<ActividadAdmin | null>(null);

  actividadesFiltradas = computed(() => {
    const term = this.busqueda().toLowerCase();
    return this.actividades().filter(act => 
      act.nombre.toLowerCase().includes(term) || 
      act.organizador.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.coordinadorService.getActividadesAdmin().subscribe(data => {
      this.actividades.set(data);
    });
  }

  // --- MÉTODOS DEL MODAL CREAR ---

  abrirModalCrear() {
    this.modalCrearVisible.set(true);
  }

  cerrarModalCrear() {
    this.modalCrearVisible.set(false);
  }

  guardarNuevaActividad(datos: any) {
    // 1. Creamos el objeto completo con los campos del modal
    const nuevaAct: ActividadAdmin = {
      id: Date.now(), // ID temporal
      nombre: datos.nombre,
      tipo: datos.tipo,
      organizador: datos.organizador,
      fecha: datos.fecha,
      estado: 'Active', 
      
      // Nuevos campos SQL que vienen del modal
      duracionHoras: datos.duracionHoras,
      cupoMaximo: datos.cupoMaximo,
      ubicacion: datos.ubicacion,
      descripcion: datos.descripcion
    };

    // 2. Enviamos al servicio (Esto actualiza el Dashboard automáticamente)
    this.coordinadorService.addActividad(nuevaAct);

    // 3. Recargamos la tabla local
    this.cargarDatos();

    alert('Actividad creada y estadísticas actualizadas.');
  }

  // --- MÉTODOS DEL MODAL DETALLE ---

  verDetalle(act: ActividadAdmin) {
    this.actividadSeleccionada.set(act);
  }

  cerrarDetalle() {
    this.actividadSeleccionada.set(null);
  }

  // Editamos stopPropagation para que no abra el detalle al hacer click en el lápiz
  editar(id: number, event: Event) {
    event.stopPropagation();
    console.log('Editar actividad', id);
  }
}
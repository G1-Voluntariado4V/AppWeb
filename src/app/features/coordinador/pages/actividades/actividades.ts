import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, ActividadAdmin } from '../../services/coordinador';
// IMPORTANTE: Importar el modal
import { ModalCrearActividad } from '../../components/modal-crear-actividad/modal-crear-actividad';

@Component({
  selector: 'app-actividades',
  standalone: true,
  // IMPORTANTE: Añadirlo a imports
  imports: [CommonModule, FormsModule, ModalCrearActividad],
  templateUrl: './actividades.html',
})
export class Actividades implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);
  actividades = signal<ActividadAdmin[]>([]);
  busqueda = signal('');
  
  // Signal del modal
  modalVisible = signal(false);

  actividadesFiltradas = computed(() => {
    const term = this.busqueda().toLowerCase();
    return this.actividades().filter(act => 
      act.nombre.toLowerCase().includes(term) || 
      act.organizador.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.coordinadorService.getActividadesAdmin().subscribe(data => {
      this.actividades.set(data);
    });
  }

  // --- MÉTODOS DEL MODAL ---

  abrirModalCrear() {
    this.modalVisible.set(true);
  }

  cerrarModal() {
    this.modalVisible.set(false);
  }

  guardarNuevaActividad(datos: any) {
    const nuevaAct: ActividadAdmin = {
      id: Date.now(),
      nombre: datos.nombre,
      tipo: datos.tipo,
      organizador: datos.organizador,
      fecha: datos.fecha, // La fecha viene en formato YYYY-MM-DD del input
      estado: 'Active'
    };

    this.actividades.update(lista => [nuevaAct, ...lista]);
    alert('Actividad creada correctamente');
  }

  editar(id: number) {
    console.log('Editar actividad', id);
  }
}
import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Ajusta la ruta de imports: subimos 4 niveles para llegar a services
import { CoordinadorService, VoluntarioAdmin } from '../../../services/coordinador';
// Importamos el componente del Modal de Detalle
import { ModalDetalleVoluntario } from '../../../components/modal-detalle-voluntario/modal-detalle-voluntario';

@Component({
  selector: 'app-voluntarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalDetalleVoluntario],
  templateUrl: './voluntarios.html',
})
export class Voluntarios implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  voluntarios = signal<VoluntarioAdmin[]>([]);
  busqueda = signal('');

  // Signal para controlar qué voluntario se ve en el detalle (null = cerrado)
  voluntarioSeleccionado = signal<VoluntarioAdmin | null>(null);

  // Filtro automático por nombre o curso
  voluntariosFiltrados = computed(() => {
    const term = this.busqueda().toLowerCase();
    return this.voluntarios().filter(vol => 
      vol.nombre.toLowerCase().includes(term) || 
      vol.curso.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.coordinadorService.getVoluntarios().subscribe(data => {
      this.voluntarios.set(data);
    });
  }

  // --- MÉTODOS PARA EL MODAL DE DETALLE ---

  verDetalle(vol: VoluntarioAdmin) {
    // Guardamos el voluntario entero para mostrarlo en el modal
    this.voluntarioSeleccionado.set(vol);
  }

  cerrarDetalle() {
    this.voluntarioSeleccionado.set(null);
  }
}
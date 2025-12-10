import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, VoluntarioAdmin } from '../../../services/coordinador';
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

  // --- NUEVO: Lógica de Filtros ---
  filtroCurso = signal('Todos');
  menuFiltroAbierto = signal(false);
  
  // Lista de cursos disponibles para el desplegable
  cursosDisponibles = ['1º SMR', '2º SMR', '1º DAM', '2º DAM', '1º GA', '2º GA', '1º AF', '2º AF'];

  // Signal para el modal de detalle
  voluntarioSeleccionado = signal<VoluntarioAdmin | null>(null);

  // --- COMPUTED ACTUALIZADO (Texto + Curso) ---
  voluntariosFiltrados = computed(() => {
    const term = this.busqueda().toLowerCase();
    const curso = this.filtroCurso();

    return this.voluntarios().filter(vol => {
      // 1. Coincide con el texto?
      const matchTexto = vol.nombre.toLowerCase().includes(term) || 
                         vol.email.toLowerCase().includes(term);
      
      // 2. Coincide con el curso? (Si es 'Todos', pasa siempre)
      const matchCurso = curso === 'Todos' || vol.curso === curso;

      return matchTexto && matchCurso;
    });
  });

  ngOnInit() {
    this.coordinadorService.getVoluntarios().subscribe(data => {
      this.voluntarios.set(data);
    });
  }

  // --- MÉTODOS FILTRO ---
  toggleFiltro() {
    this.menuFiltroAbierto.update(v => !v);
  }

  seleccionarFiltro(curso: string) {
    this.filtroCurso.set(curso);
    this.menuFiltroAbierto.set(false); // Cerrar menú al seleccionar
  }

  // --- MÉTODOS DETALLE ---
  verDetalle(vol: VoluntarioAdmin) {
    this.voluntarioSeleccionado.set(vol);
  }

  cerrarDetalle() {
    this.voluntarioSeleccionado.set(null);
  }
}
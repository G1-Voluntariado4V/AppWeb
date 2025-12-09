import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, VoluntarioAdmin } from '../../../services/coordinador';

@Component({
  selector: 'app-voluntarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './voluntarios.html',
})
export class Voluntarios implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  voluntarios = signal<VoluntarioAdmin[]>([]);
  busqueda = signal('');

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

  verDetalle(id: number) {
    console.log('Ver detalle voluntario', id);
  }
}

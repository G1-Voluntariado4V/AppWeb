import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, ActividadAdmin } from '../../services/coordinador';

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actividades.html',
})
export class Actividades implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  actividades = signal<ActividadAdmin[]>([]);
  busqueda = signal('');

  // Filtro automático
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

  abrirModalCrear() {
    console.log('Nueva actividad');
  }

  editar(id: number) {
    console.log('Editar actividad', id);
  }
}
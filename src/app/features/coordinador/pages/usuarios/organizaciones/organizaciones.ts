import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Ajusta la ruta de importación según dónde esté tu servicio
import { CoordinadorService, OrganizacionAdmin } from '../../../services/coordinador';

@Component({
  selector: 'app-organizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organizaciones.html',
})
export class Organizaciones implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  // Lista de organizaciones
  organizaciones = signal<OrganizacionAdmin[]>([]);
  
  // Buscador
  busqueda = signal('');

  // Filtro automático
  organizacionesFiltradas = computed(() => {
    const term = this.busqueda().toLowerCase();
    return this.organizaciones().filter(org => 
      org.nombre.toLowerCase().includes(term) || 
      org.contacto.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.coordinadorService.getOrganizaciones().subscribe(data => {
      this.organizaciones.set(data);
    });
  }

  // Acciones (Visuales)
  abrirModalCrear() {
    console.log('Abrir popup de nueva organización');
  }

  editar(id: number) {
    console.log('Editar organización', id);
  }
}
import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, OrganizacionAdmin } from '../../../services/coordinador';
// IMPORTANTE: Importar el modal
import { ModalCrearOrganizacion } from '../../../components/modal-crear-organizacion/modal-crear-organizacion';

@Component({
  selector: 'app-organizaciones',
  standalone: true,
  // IMPORTANTE: Añadirlo a imports
  imports: [CommonModule, FormsModule, ModalCrearOrganizacion],
  templateUrl: './organizaciones.html',
})
export class Organizaciones implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);
  organizaciones = signal<OrganizacionAdmin[]>([]);
  busqueda = signal('');
  
  // Signal para controlar si el modal se ve o no
  modalVisible = signal(false);

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

  // --- MÉTODOS DEL MODAL ---

  abrirModalCrear() {
    this.modalVisible.set(true); // Muestra el modal
  }

  cerrarModal() {
    this.modalVisible.set(false); // Oculta el modal
  }

  guardarNuevaOrganizacion(datos: any) {
    // Aquí añadimos la nueva org a la lista (Simulado)
    const nuevaOrg: OrganizacionAdmin = {
      id: Date.now(), // ID temporal
      nombre: datos.nombre,
      tipo: datos.tipo,
      contacto: datos.contacto,
      email: datos.email,
      actividadesCount: 0,
      estado: 'Active'
    };

    // Actualizamos la lista local
    this.organizaciones.update(lista => [nuevaOrg, ...lista]);
    alert('Organización creada correctamente');
  }

  editar(id: number) {
    console.log('Editar organización', id);
  }
}
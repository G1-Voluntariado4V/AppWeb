import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Ajusta la ruta de imports según tu estructura de carpetas
import { CoordinadorService, OrganizacionAdmin } from '../../../services/coordinador';
// Importamos AMBOS modales
import { ModalCrearOrganizacion } from '../../../components/modal-crear-organizacion/modal-crear-organizacion';
import { ModalDetalleOrganizacion } from '../../../components/modal-detalle-organizacion/modal-detalle-organizacion';

@Component({
  selector: 'app-organizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCrearOrganizacion, ModalDetalleOrganizacion],
  templateUrl: './organizaciones.html',
})
export class Organizaciones implements OnInit {
  
  private coordinadorService = inject(CoordinadorService);

  organizaciones = signal<OrganizacionAdmin[]>([]);
  busqueda = signal('');
  
  // Signal para controlar el modal de CREACIÓN
  modalCrearVisible = signal(false);
  
  // Signal para el modal de DETALLE (guarda la org seleccionada o null)
  orgSeleccionada = signal<OrganizacionAdmin | null>(null);

  // Filtro
  organizacionesFiltradas = computed(() => {
    const term = this.busqueda().toLowerCase();
    return this.organizaciones().filter(org => 
      org.nombre.toLowerCase().includes(term) || 
      org.contacto.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.coordinadorService.getOrganizaciones().subscribe(data => {
      this.organizaciones.set(data);
    });
  }

  // --- MÉTODOS DEL MODAL CREAR ---
  abrirModalCrear() { 
    this.modalCrearVisible.set(true); 
  }
  
  cerrarModalCrear() { 
    this.modalCrearVisible.set(false); 
  }

  guardarNuevaOrganizacion(datos: any) {
    const nuevaOrg: OrganizacionAdmin = {
      id: Date.now(),
      nombre: datos.nombre,
      tipo: datos.tipo,
      contacto: datos.contacto || 'Pendiente',
      email: datos.email,
      actividadesCount: 0,
      estado: 'Active',
      cif: datos.cif,
      telefono: datos.telefono,
      direccion: datos.direccion,
      sitioWeb: datos.sitioWeb,
      descripcion: 'Organización añadida manualmente.'
    };
    
    this.coordinadorService.addOrganizacion(nuevaOrg);
    this.cargarDatos(); // Recargar para verla en la tabla
    alert('Organización creada.');
  }

  // --- MÉTODOS DEL MODAL DETALLE (Ver Ficha) ---
  verDetalle(org: OrganizacionAdmin) {
    this.orgSeleccionada.set(org); 
  }

  cerrarDetalle() {
    this.orgSeleccionada.set(null);
  }

  // Evita que el click en editar abra también el detalle
  editar(id: number, event: Event) {
    event.stopPropagation(); 
    console.log('Editar organización', id);
  }
}
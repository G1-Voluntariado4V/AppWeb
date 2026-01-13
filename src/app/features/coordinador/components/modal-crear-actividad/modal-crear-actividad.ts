import { Component, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, ODS, TipoVoluntariado, OrganizacionAdmin } from '../../services/coordinador';

@Component({
  selector: 'app-modal-crear-actividad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-crear-actividad.html',
})
export class ModalCrearActividad implements OnInit {

  private coordinadorService = inject(CoordinadorService);

  close = output<void>();
  save = output<any>();

  // Datos del formulario
  titulo = signal('');
  descripcion = signal('');
  ubicacion = signal('');
  duracionHoras = signal<number>(2);
  cupoMaximo = signal<number>(10);
  fecha = signal(new Date().toISOString().split('T')[0]);
  organizacionId = signal<number | null>(null);
  imagenNombre = signal('');

  // Selecciones
  odsSeleccionados = signal<number[]>([]);
  tiposSeleccionados = signal<number[]>([]);

  // Catálogos desde la BD
  odsList = signal<ODS[]>([]);
  tiposList = signal<TipoVoluntariado[]>([]);
  organizaciones = signal<OrganizacionAdmin[]>([]);

  // Colores para ODS (17 ODS oficiales)
  odsColores: Record<number, { color: string; icon: string }> = {
    1: { color: 'bg-red-600', icon: 'fa-solid fa-piggy-bank' },
    2: { color: 'bg-amber-500', icon: 'fa-solid fa-wheat-awn' },
    3: { color: 'bg-green-500', icon: 'fa-solid fa-heart-pulse' },
    4: { color: 'bg-red-500', icon: 'fa-solid fa-book-open' },
    5: { color: 'bg-orange-500', icon: 'fa-solid fa-venus-mars' },
    6: { color: 'bg-cyan-500', icon: 'fa-solid fa-droplet' },
    7: { color: 'bg-yellow-400', icon: 'fa-solid fa-sun' },
    8: { color: 'bg-rose-700', icon: 'fa-solid fa-briefcase' },
    9: { color: 'bg-orange-600', icon: 'fa-solid fa-industry' },
    10: { color: 'bg-pink-600', icon: 'fa-solid fa-equals' },
    11: { color: 'bg-amber-600', icon: 'fa-solid fa-city' },
    12: { color: 'bg-amber-700', icon: 'fa-solid fa-recycle' },
    13: { color: 'bg-green-700', icon: 'fa-solid fa-earth-americas' },
    14: { color: 'bg-blue-500', icon: 'fa-solid fa-fish' },
    15: { color: 'bg-green-600', icon: 'fa-solid fa-tree' },
    16: { color: 'bg-blue-700', icon: 'fa-solid fa-dove' },
    17: { color: 'bg-blue-900', icon: 'fa-solid fa-handshake' }
  };

  ngOnInit() {
    // Cargar catálogos desde el servicio
    this.odsList.set(this.coordinadorService.odsList());
    this.tiposList.set(this.coordinadorService.tiposList());

    // Cargar organizaciones para el select
    this.coordinadorService.getOrganizaciones().subscribe(orgs => {
      this.organizaciones.set(orgs.filter(o => o.estado === 'Activa'));
    });
  }

  getOdsStyle(odsId: number): { color: string; icon: string } {
    return this.odsColores[odsId] || { color: 'bg-gray-500', icon: 'fa-solid fa-circle' };
  }

  toggleOds(id: number) {
    this.odsSeleccionados.update(lista => {
      if (lista.includes(id)) return lista.filter(x => x !== id);
      return [...lista, id];
    });
  }

  toggleTipo(id: number) {
    this.tiposSeleccionados.update(lista => {
      if (lista.includes(id)) return lista.filter(x => x !== id);
      return [...lista, id];
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenNombre.set(file.name);
    }
  }

  cerrar() {
    this.close.emit();
  }

  guardar() {
    if (!this.titulo()) {
      alert('El título es obligatorio');
      return;
    }
    if (!this.fecha()) {
      alert('La fecha es obligatoria');
      return;
    }
    if (!this.organizacionId()) {
      alert('Debe seleccionar una organización');
      return;
    }

    this.save.emit({
      id_organizacion: this.organizacionId(),
      titulo: this.titulo(),
      descripcion: this.descripcion(),
      ubicacion: this.ubicacion(),
      duracion_horas: this.duracionHoras(),
      cupo_maximo: this.cupoMaximo(),
      fecha_inicio: this.fecha(),
      odsIds: this.odsSeleccionados(),
      tiposIds: this.tiposSeleccionados()
    });
    this.cerrar();
  }
}
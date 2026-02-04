import { Component, output, input, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, OrganizacionAdmin, ActividadAdmin } from '../../services/coordinador';

@Component({
  selector: 'app-modal-crear-actividad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-crear-actividad.html',
})
export class ModalCrearActividad implements OnInit {

  private coordinadorService = inject(CoordinadorService);

  // Input para modo edición
  actividadEditar = input<ActividadAdmin | null>(null);

  close = output<void>();
  save = output<any>();

  // Datos del formulario
  titulo = signal('');
  descripcion = signal('');
  ubicacion = signal('');
  duracionHoras = signal<number>(2);
  cupoMaximo = signal<number>(10);
  fechaInicio = signal(new Date().toISOString().split('T')[0]);
  horaInicio = signal('09:00');
  organizacionId = signal<number | null>(null);

  // Imagen
  imagenNombre = signal('');
  imagenFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  // Periodica
  esPeriodica = signal(false);
  frecuencia = signal<'semanal' | 'quincenal' | 'mensual' | 'trimestral'>('semanal');
  numRepeticiones = signal(2);

  // Selecciones
  odsSeleccionados = signal<number[]>([]);
  tiposSeleccionados = signal<number[]>([]);

  // Catálogos
  odsList = this.coordinadorService.odsList;
  tiposList = this.coordinadorService.tiposList;
  organizaciones = signal<OrganizacionAdmin[]>([]);

  modoEdicion = signal(false);

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

  constructor() {
    // Al crearse el componente, si hay una actividad para editar, cargamos sus datos.
    setTimeout(() => {
      const act = this.actividadEditar();
      if (act) {
        this.cargarDatosEdicion(act);
        // Pedimos el detalle completo por si el listado base no trae ODS/Tipos
        this.coordinadorService.getActividadDetalle(act.id).subscribe(full => this.cargarDatosEdicion(full));
      }
    }, 50);
  }

  ngOnInit() {
    this.coordinadorService.getOrganizaciones().subscribe(orgs => {
      this.organizaciones.set(orgs.filter(o => o.estado === 'Activa'));
    });
  }

  private cargarDatosEdicion(act: ActividadAdmin) {
    this.modoEdicion.set(true);
    this.titulo.set(act.titulo);
    this.descripcion.set(act.descripcion || '');
    this.ubicacion.set(act.ubicacion || '');
    this.duracionHoras.set(act.duracion_horas || 2);
    this.cupoMaximo.set(act.cupo_maximo || 10);
    this.organizacionId.set(act.organizacionId || null);

    if (act.fecha_inicio) {
      const date = new Date(act.fecha_inicio);
      this.fechaInicio.set(date.toISOString().split('T')[0]);
      this.horaInicio.set(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
    }

    // Mapeo flexible
    if (act.ods && Array.isArray(act.ods)) {
      this.odsSeleccionados.set(act.ods.map((o: any) => Number(o.id || o.id_ods || o)));
    }
    if (act.tipos && Array.isArray(act.tipos)) {
      this.tiposSeleccionados.set(act.tipos.map((t: any) => Number(t.id || t.id_tipo || t)));
    }

    if (act.imagen_actividad) {
      this.previewUrl.set(`http://localhost:8000/uploads/actividades/${act.imagen_actividad}`);
    }
  }

  getOdsImageUrl(id: number): string {
    const ods = this.odsList().find(o => o.id === id);
    return ods?.imgUrl || '';
  }

  getOdsStyle(odsId: number): { color: string; icon: string } {
    return this.odsColores[odsId] || { color: 'bg-gray-500', icon: 'fa-solid fa-circle' };
  }

  toggleOds(id: number) {
    this.odsSeleccionados.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }

  toggleTipo(id: number) {
    this.tiposSeleccionados.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenFile.set(file);
      this.imagenNombre.set(file.name);

      const reader = new FileReader();
      reader.onload = e => this.previewUrl.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  cerrar() { this.close.emit(); }

  guardar() {
    // Validaciones básicas
    if (!this.titulo() || !this.organizacionId()) {
      alert('Rellena los campos obligatorios (Título y Organización)');
      return;
    }

    if (this.esPeriodica() && this.numRepeticiones() < 2) {
      alert('Para un programa periódico, debes crear al menos 2 repeticiones');
      return;
    }

    const payload = {
      id_organizacion: this.organizacionId(),
      titulo: this.titulo(),
      descripcion: this.descripcion(),
      ubicacion: this.ubicacion(),
      duracion_horas: this.duracionHoras(),
      cupo_maximo: this.cupoMaximo(),
      fecha_inicio: `${this.fechaInicio()} ${this.horaInicio()}:00`,
      odsIds: this.odsSeleccionados(),
      tiposIds: this.tiposSeleccionados(),
      esPeriodica: this.esPeriodica(),
      frecuencia: this.frecuencia(),
      repeticiones: this.numRepeticiones()
    };

    this.save.emit({ data: payload, image: this.imagenFile() });
  }
}

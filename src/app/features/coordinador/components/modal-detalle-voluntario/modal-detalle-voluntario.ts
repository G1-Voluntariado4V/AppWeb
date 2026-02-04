import { Component, input, output, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { CoordinadorService, VoluntarioAdmin, ActividadAdmin, Idioma } from '../../services/coordinador';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalDetalleActividad } from '../modal-detalle-actividad/modal-detalle-actividad';

@Component({
  selector: 'app-modal-detalle-voluntario',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalDetalleActividad],
  templateUrl: './modal-detalle-voluntario.html',
})
export class ModalDetalleVoluntario implements OnInit {
  public coordinadorService = inject(CoordinadorService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  vol = input.required<VoluntarioAdmin>();
  close = output<void>();
  updated = output<void>();

  // Estado local
  volCompleto = signal<VoluntarioAdmin | null>(null);
  vData = computed(() => this.volCompleto() || this.vol());

  editando = signal(false);
  guardando = signal(false);

  actividadSeleccionada = signal<ActividadAdmin | null>(null);

  historial = signal<any[]>([]);
  horasTotales = signal(0);
  actividadesCount = signal(0);
  cargandoHistorial = signal(true);

  // Editables
  nombreEditable = '';
  apellidosEditable = '';
  telefonoEditable = '';
  cursoEditable = '';      // Nombre del curso (para mostrar cuando no se edita o fallback)
  fechaNacEditable = '';
  descripcionEditable = '';

  // Selección de curso
  selectedLevel = signal<number>(1);
  selectedCursoId: number | null = null; // ID real del curso seleccionado

  // Listas cargadas
  allCourses: any[] = [];
  availableLevels = signal<number[]>([]);
  availableCycles = signal<any[]>([]);
  idiomasDisponibles = signal<Idioma[]>([]);

  // Estado nuevo idioma
  nuevoIdiomaId: number | null = null;
  nuevoIdiomaNivel: string = 'B1';
  nivelesIdiomas = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Nativo'];

  ngOnInit() {
    this.volCompleto.set(this.vol());
    this.cargarHistorial();
    this.cargarDetalleCompleto();
    this.cargarCursosBackend();
    this.cargarIdiomasBackend();
  }

  cargarDetalleCompleto() {
    this.coordinadorService.getVoluntarioDetalle(this.vol().id).subscribe({
      next: (fullData) => {
        const current = this.volCompleto();
        const merged = current ? {
          ...current,
          ...fullData,
          dni: fullData.dni || current.dni,
          foto: fullData.foto || current.foto,
          curso: fullData.curso || current.curso,
          descripcion: fullData.descripcion || current.descripcion
        } : fullData;

        this.volCompleto.set(merged);

      },
      error: (err) => console.error('Error cargando detalle voluntario:', err)
    });
  }

  cargarCursosBackend() {
    // Carga independiente para asegurar datos frescos como en Registro
    const t = new Date().getTime();
    this.http.get<any[]>(`${this.apiUrl}/catalogos/cursos?t=${t}`).subscribe({
      next: (data) => {
        this.allCourses = data.map(c => ({
          ...c,
          nivel: c.nivel !== undefined ? c.nivel : (c.nombre.match(/^(\d+)º/)?.[1] ? parseInt(c.nombre.match(/^(\d+)º/)[1]) : 1),
          nombreClean: c.nombre
        }));

        const levels = [...new Set(this.allCourses.map(c => c.nivel))].sort((a, b) => a - b);
        this.availableLevels.set(levels.length ? levels : [1, 2]);

        // Si estamos editando y ya tenemos curso seleccionado, recalcular availableCycles podría ser útil,
        // pero lo hacemos en iniciarEdicion.
      },
      error: (err) => console.error('Error cargando cursos en modal:', err)
    });
  }

  cargarIdiomasBackend() {
    this.idiomasDisponibles.set(this.coordinadorService.idiomasList());
  }

  cargarHistorial() {
    this.cargandoHistorial.set(true);
    this.coordinadorService.getHistorialVoluntario(this.vol().id).subscribe({
      next: (data) => {
        const acts = data.actividades || [];
        this.historial.set(acts);
        this.horasTotales.set(data.resumen?.horas_acumuladas || 0);

        // El contador de "Aprobadas" sigue siendo solo de las aceptadas/finalizadas
        const countAprobadas = acts.filter((a: any) => {
          const s = a.estado || a.estado_solicitud || a.status;
          return s === 'Aceptada' || s === 'Finalizada';
        }).length;

        this.actividadesCount.set(countAprobadas);
        this.cargandoHistorial.set(false);
      },
      error: () => this.cargandoHistorial.set(false)
    });
  }

  cerrar() {
    this.editando.set(false);
    this.close.emit();
  }

  verActividad(idActividad: number) {
    if (!idActividad) return;
    const dummy: ActividadAdmin = {
      id: idActividad, title: 'Cargando...', organizacion: '...',
      fecha_inicio: new Date().toISOString(), estado: 'Publicada'
    } as any;
    this.actividadSeleccionada.set(dummy);
  }

  cerrarActividad() {
    this.actividadSeleccionada.set(null);
  }

  // --- LOGICA CURSOS ---

  onLevelChange(level: number) {
    this.selectedLevel.set(level);
    const filtered = this.allCourses.filter(c => c.nivel === level);
    this.availableCycles.set(filtered);
    this.selectedCursoId = null; // Reset selección específica
  }

  iniciarEdicion() {
    const v = this.vData();
    this.nombreEditable = v.nombre || '';
    this.apellidosEditable = v.apellidos || '';
    this.telefonoEditable = v.telefono || '';
    this.descripcionEditable = v.descripcion || '';
    this.cursoEditable = v.curso || '';
    this.fechaNacEditable = v.fecha_nac ? v.fecha_nac.split('T')[0] : '';

    // Intentar detectar ID o Nivel del curso actual
    // Si tenemos el nombre "1º DAM", buscamos match en allCourses
    if (this.allCourses.length > 0 && this.cursoEditable) {
      const found = this.allCourses.find(c => c.nombre === this.cursoEditable);
      if (found) {
        this.selectedLevel.set(found.nivel);
        this.selectedCursoId = found.id;
        this.onLevelChange(found.nivel);
        this.selectedCursoId = found.id; // Restaurar tras reset en onLevelChange
      } else {
        // Fallback parseo string
        const match = this.cursoEditable.match(/^(\d+)º/);
        const lvl = match ? parseInt(match[1]) : 1;
        this.onLevelChange(lvl);
      }
    } else {
      this.onLevelChange(1);
    }

    this.editando.set(true);
  }

  cancelarEdicion() {
    this.editando.set(false);
  }

  guardarCambios() {
    if (!this.nombreEditable.trim() || !this.apellidosEditable.trim()) {
      this.toastService.error('El nombre y apellidos son obligatorios');
      return;
    }

    this.guardando.set(true);

    // Buscar el nombre del curso seleccionado por ID si existe
    let cursoNombreFinal = this.cursoEditable;
    if (this.selectedCursoId) {
      const c = this.allCourses.find(x => x.id == this.selectedCursoId);
      if (c) cursoNombreFinal = c.nombre;
    }

    const payload: any = {
      nombre: this.nombreEditable.trim(),
      apellidos: this.apellidosEditable.trim(),
      telefono: this.telefonoEditable.trim() || undefined,
      descripcion: this.descripcionEditable.trim() || undefined,
      curso: cursoNombreFinal,     // String para interfaz legacy
      id_curso_actual: this.selectedCursoId, // ID para backend (si lo soporta)
      fecha_nac: this.fechaNacEditable || undefined
    };

    this.coordinadorService.editarVoluntario(this.vol().id, payload).subscribe({
      next: () => {
        this.toastService.success('Voluntario actualizado correctamente');
        this.guardando.set(false);
        this.editando.set(false);

        // Actualizar local
        this.volCompleto.update(v => v ? ({
          ...v,
          ...payload,
          curso: cursoNombreFinal || v.curso // Asegurar string
        }) : null);

        this.updated.emit();
      },
      error: (err: any) => {
        console.error(err);
        this.toastService.error('Error al guardar cambios.');
        this.guardando.set(false);
      }
    });
  }

  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      'Activa': 'bg-green-100 text-green-700 border-green-200',
      'Aceptada': 'bg-green-100 text-green-700 border-green-200',
      'Pendiente': 'bg-orange-100 text-orange-700 border-orange-200',
      'Bloqueada': 'bg-red-100 text-red-700 border-red-200',
      'Rechazada': 'bg-red-100 text-red-700 border-red-200',
    };
    return clases[estado] || 'bg-gray-50 text-gray-600 border-gray-200';
    return clases[estado] || 'bg-gray-50 text-gray-600 border-gray-200';
  }

  // --- ARREGLO IDIOMAS ---
  getIdiomasVoluntario() {
    return this.volCompleto()?.idiomas || [];
  }

  agregarIdioma() {
    if (!this.nuevoIdiomaId || !this.nuevoIdiomaNivel) return;

    this.coordinadorService.addIdiomaVoluntario(this.vol().id, this.nuevoIdiomaId, this.nuevoIdiomaNivel)
      .subscribe({
        next: () => {
          this.toastService.success('Idioma añadido');
          // Actualizar localmente
          const idiomaObj = this.idiomasDisponibles().find(i => i.id == this.nuevoIdiomaId);
          if (idiomaObj) {
            const nuevo = { id_idioma: this.nuevoIdiomaId!, idioma: idiomaObj.nombre, nivel: this.nuevoIdiomaNivel };
            this.volCompleto.update(v => v ? { ...v, idiomas: [...(v.idiomas || []), nuevo] } : null);
          }
          this.nuevoIdiomaId = null;
          this.nuevoIdiomaNivel = 'B1';
        },
        error: (err) => this.toastService.error('Error al añadir idioma')
      });
  }

  actualizarNivelIdioma(idIdioma: number, nuevoNivel: string) {
    this.coordinadorService.updateIdiomaVoluntario(this.vol().id, idIdioma, nuevoNivel)
      .subscribe({
        next: () => {
          this.toastService.success('Nivel actualizado');
          this.volCompleto.update(v => {
            if (!v) return null;
            const nuevosIdiomas = v.idiomas?.map(i => i.id_idioma === idIdioma ? { ...i, nivel: nuevoNivel } : i) || [];
            return { ...v, idiomas: nuevosIdiomas };
          });
        },
        error: () => this.toastService.error('Error al actualizar nivel')
      });
  }

  eliminarIdioma(idIdioma: number) {
    if (!confirm('¿Eliminar idioma?')) return;

    this.coordinadorService.removeIdiomaVoluntario(this.vol().id, idIdioma)
      .subscribe({
        next: () => {
          this.toastService.success('Idioma eliminado');
          this.volCompleto.update(v => {
            if (!v) return null;
            return { ...v, idiomas: v.idiomas?.filter(i => i.id_idioma !== idIdioma) || [] };
          });
        },
        error: () => this.toastService.error('Error al eliminar idioma')
      });
  }
}

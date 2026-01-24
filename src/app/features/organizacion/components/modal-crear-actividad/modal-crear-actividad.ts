import { Component, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService, ODS, TipoVoluntariado } from '../../services/organizacion.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-modal-crear-actividad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-crear-actividad.html',
})
export class ModalCrearActividad implements OnInit {
  close = output<void>();
  save = output<any>();

  // Expose Math for template use
  Math = Math;

  private orgService = inject(OrganizacionService);

  // Catálogos desde la API
  odsList = this.orgService.odsList;
  tiposList = this.orgService.tiposList;

  // Datos del formulario
  titulo = signal('');
  descripcion = signal('');
  fechaInicio = signal('');
  horaInicio = signal('09:00');
  duracionHoras = signal(2);
  cupoMaximo = signal(10);
  ubicacion = signal('');

  // Actividad periódica
  esPeriodica = signal(false);
  frecuencia = signal<'semanal' | 'quincenal' | 'mensual'>('semanal');
  repeticiones = signal(4);

  // Selecciones múltiples
  odsSeleccionados = signal<number[]>([]);
  tiposSeleccionados = signal<number[]>([]);

  // Estado
  guardando = signal(false);
  error = signal<string | null>(null);
  progreso = signal<{ actual: number; total: number } | null>(null);

  // Límites
  readonly MAX_DESCRIPCION = 500;
  readonly MAX_DURACION = 24;
  readonly MIN_DURACION = 1;
  readonly MAX_CUPO = 500;
  readonly MIN_CUPO = 1;

  ngOnInit() {
    // Establecer fecha mínima como hoy
    const hoy = new Date().toISOString().split('T')[0];
    if (!this.fechaInicio()) {
      this.fechaInicio.set(hoy);
    }
  }

  // Contador de caracteres para descripción
  get caracteresRestantes(): number {
    return this.MAX_DESCRIPCION - this.descripcion().length;
  }

  // Actualizar descripción con límite
  actualizarDescripcion(valor: string) {
    if (valor.length <= this.MAX_DESCRIPCION) {
      this.descripcion.set(valor);
    } else {
      this.descripcion.set(valor.substring(0, this.MAX_DESCRIPCION));
    }
  }

  // Actualizar duración con límites
  actualizarDuracion(valor: number) {
    const num = Number(valor);
    if (isNaN(num)) return;
    this.duracionHoras.set(Math.min(this.MAX_DURACION, Math.max(this.MIN_DURACION, num)));
  }

  // Actualizar cupo con límites
  actualizarCupo(valor: number) {
    const num = Number(valor);
    if (isNaN(num)) return;
    this.cupoMaximo.set(Math.min(this.MAX_CUPO, Math.max(this.MIN_CUPO, num)));
  }

  toggleOds(id: number) {
    this.odsSeleccionados.update(lista =>
      lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id]
    );
  }

  toggleTipo(id: number) {
    this.tiposSeleccionados.update(lista =>
      lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id]
    );
  }

  // Obtener fecha mínima (hoy)
  getFechaMinima(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Validar que la fecha no sea pasada
  validarFecha(): boolean {
    const fechaSeleccionada = new Date(this.fechaInicio() + 'T' + this.horaInicio());
    const ahora = new Date();
    return fechaSeleccionada > ahora;
  }

  validarFormulario(): boolean {
    this.error.set(null);

    if (!this.titulo().trim()) {
      this.error.set('El título es obligatorio');
      return false;
    }

    if (this.titulo().length < 5) {
      this.error.set('El título debe tener al menos 5 caracteres');
      return false;
    }

    if (!this.fechaInicio()) {
      this.error.set('La fecha de inicio es obligatoria');
      return false;
    }

    if (!this.validarFecha()) {
      this.error.set('La fecha y hora deben ser futuras');
      return false;
    }

    if (!this.ubicacion().trim()) {
      this.error.set('La ubicación es obligatoria');
      return false;
    }

    if (this.duracionHoras() < this.MIN_DURACION || this.duracionHoras() > this.MAX_DURACION) {
      this.error.set(`La duración debe estar entre ${this.MIN_DURACION} y ${this.MAX_DURACION} horas`);
      return false;
    }

    if (this.cupoMaximo() < this.MIN_CUPO || this.cupoMaximo() > this.MAX_CUPO) {
      this.error.set(`El cupo debe estar entre ${this.MIN_CUPO} y ${this.MAX_CUPO} voluntarios`);
      return false;
    }

    if (this.esPeriodica() && this.repeticiones() < 2) {
      this.error.set('Las actividades periódicas deben tener al menos 2 repeticiones');
      return false;
    }

    // Validar que se haya seleccionado al menos un tipo de voluntariado (requerido por el backend)
    if (this.tiposSeleccionados().length === 0) {
      this.error.set('Debes seleccionar al menos un tipo de voluntariado');
      return false;
    }

    return true;
  }

  // Calcular las fechas para actividades periódicas
  private calcularFechasPeriodicas(): string[] {
    const fechas: string[] = [];
    const fechaBase = new Date(this.fechaInicio() + 'T' + this.horaInicio() + ':00');

    for (let i = 0; i < this.repeticiones(); i++) {
      const nuevaFecha = new Date(fechaBase);

      switch (this.frecuencia()) {
        case 'semanal':
          nuevaFecha.setDate(nuevaFecha.getDate() + (i * 7));
          break;
        case 'quincenal':
          nuevaFecha.setDate(nuevaFecha.getDate() + (i * 14));
          break;
        case 'mensual':
          nuevaFecha.setMonth(nuevaFecha.getMonth() + i);
          break;
      }

      // Formato: YYYY-MM-DD HH:mm:ss
      const año = nuevaFecha.getFullYear();
      const mes = String(nuevaFecha.getMonth() + 1).padStart(2, '0');
      const dia = String(nuevaFecha.getDate()).padStart(2, '0');
      const hora = String(nuevaFecha.getHours()).padStart(2, '0');
      const minutos = String(nuevaFecha.getMinutes()).padStart(2, '0');

      fechas.push(`${año}-${mes}-${dia} ${hora}:${minutos}:00`);
    }

    return fechas;
  }

  guardar() {
    this.error.set(null);

    if (!this.validarFormulario()) return;

    this.guardando.set(true);

    if (this.esPeriodica()) {
      this.crearActividadesPeriodicas();
    } else {
      this.crearActividadUnica();
    }
  }

  private crearActividadUnica() {
    const fechaCompleta = `${this.fechaInicio()} ${this.horaInicio()}:00`;

    const datos = {
      titulo: this.titulo(),
      descripcion: this.descripcion() || undefined,
      fecha_inicio: fechaCompleta,
      duracion_horas: Number(this.duracionHoras()),
      cupo_maximo: Number(this.cupoMaximo()),
      ubicacion: this.ubicacion(),
      odsIds: this.odsSeleccionados(),
      tiposIds: this.tiposSeleccionados()
    };

    console.log('📤 Enviando datos de actividad:', datos);

    this.orgService.crearActividad(datos).subscribe({
      next: (respuesta) => {
        this.guardando.set(false);
        this.save.emit(respuesta);
        this.close.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        const mensaje = err.error?.error || err.error?.message || 'Error al crear la actividad';
        this.error.set(mensaje);
      }
    });
  }

  private crearActividadesPeriodicas() {
    const fechas = this.calcularFechasPeriodicas();
    const total = fechas.length;

    this.progreso.set({ actual: 0, total });

    // Crear un array de observables para cada actividad
    const peticiones = fechas.map((fecha, index) => {
      const datos = {
        titulo: `${this.titulo()} (${index + 1}/${total})`,
        descripcion: this.descripcion() || undefined,
        fecha_inicio: fecha,
        duracion_horas: Number(this.duracionHoras()),
        cupo_maximo: Number(this.cupoMaximo()),
        ubicacion: this.ubicacion(),
        odsIds: this.odsSeleccionados(),
        tiposIds: this.tiposSeleccionados()
      };

      return this.orgService.crearActividad(datos).pipe(
        map(respuesta => {
          // Actualizar progreso
          this.progreso.update(p => p ? { ...p, actual: p.actual + 1 } : null);
          return { success: true, data: respuesta, index };
        }),
        catchError(err => {
          this.progreso.update(p => p ? { ...p, actual: p.actual + 1 } : null);
          return of({ success: false, error: err, index });
        })
      );
    });

    // Ejecutar todas las peticiones
    forkJoin(peticiones).subscribe({
      next: (resultados) => {
        this.guardando.set(false);
        this.progreso.set(null);

        const exitosas = resultados.filter(r => r.success).length;
        const fallidas = resultados.filter(r => !r.success).length;

        if (fallidas === 0) {
          console.log(`✅ ${exitosas} actividades creadas correctamente`);
          this.save.emit({ total: exitosas, periodica: true });
          this.close.emit();
        } else if (exitosas > 0) {
          this.error.set(`Se crearon ${exitosas} actividades, pero ${fallidas} fallaron`);
          // Aún así cerramos tras unos segundos
          setTimeout(() => {
            this.save.emit({ total: exitosas, fallidas, periodica: true });
            this.close.emit();
          }, 2000);
        } else {
          this.error.set('Error al crear las actividades periódicas');
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.progreso.set(null);
        this.error.set('Error al crear las actividades periódicas');
        console.error('Error:', err);
      }
    });
  }
}

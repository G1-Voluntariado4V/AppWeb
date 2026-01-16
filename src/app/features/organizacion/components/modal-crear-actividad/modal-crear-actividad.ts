import { Component, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService, ODS, TipoVoluntariado } from '../../services/organizacion.service';

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

  // Selecciones múltiples
  odsSeleccionados = signal<number[]>([]);
  tiposSeleccionados = signal<number[]>([]);

  // Estado
  guardando = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    // Establecer fecha mínima como hoy
    const hoy = new Date().toISOString().split('T')[0];
    if (!this.fechaInicio()) {
      this.fechaInicio.set(hoy);
    }
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

  validarFormulario(): boolean {
    if (!this.titulo().trim()) {
      this.error.set('El título es obligatorio');
      return false;
    }
    if (!this.fechaInicio()) {
      this.error.set('La fecha de inicio es obligatoria');
      return false;
    }
    if (!this.ubicacion().trim()) {
      this.error.set('La ubicación es obligatoria');
      return false;
    }
    if (this.duracionHoras() < 1) {
      this.error.set('La duración debe ser al menos 1 hora');
      return false;
    }
    if (this.cupoMaximo() < 1) {
      this.error.set('El cupo debe ser al menos 1 voluntario');
      return false;
    }
    return true;
  }

  guardar() {
    this.error.set(null);

    if (!this.validarFormulario()) return;

    this.guardando.set(true);

    // Construir fecha con hora en formato Symfony DateTime (Y-m-d H:i:s)
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
}

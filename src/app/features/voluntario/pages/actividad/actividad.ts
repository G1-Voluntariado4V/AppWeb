import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
// Importamos el servicio para que los datos estén sincronizados
import { VoluntarioService } from '../../services/voluntario.service';

@Component({
  selector: 'app-actividad',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './actividad.html',
})
export class Actividad implements OnInit {
  
  // Inyecciones
  private route = inject(ActivatedRoute);
  private voluntarioService = inject(VoluntarioService); 

  // Señal para la vista
  actividad = signal<any>({
    titulo: 'Cargando...',
    organizacion: '',
    estado: '', 
    ods: []
  });

  // Guardamos el ID de la actividad que estamos viendo
  currentId = '';

  ngOnInit() {
    // 1. Obtenemos el ID de la URL
    const idUrl = this.route.snapshot.paramMap.get('id');
    
    if (idUrl) {
      this.currentId = idUrl;
      this.cargarDatos();
    }
  }

  // Función para leer los datos del servicio (donde están guardados los cambios)
  cargarDatos() {
    const datos = this.voluntarioService.getActividadById(this.currentId);
    
    if (datos) {
      // Usamos {...datos} para crear una copia y refrescar la vista
      this.actividad.set({ ...datos }); 
    } else {
      this.actividad.set({ 
        titulo: 'Actividad no encontrada', 
        estado: '-', 
        ods: [] 
      });
    }
  }

  // --- ACCIONES (Ahora guardan en el servicio) ---

  aceptar() {
    // 1. Guardamos el cambio en el servicio
    this.voluntarioService.updateEstado(this.currentId, 'Aceptada');
    // 2. Recargamos la vista local para ver el botón nuevo
    this.cargarDatos();
    alert('¡Has aceptado la actividad! Ahora estás inscrito.');
  }

  rechazar() {
    if(confirm('¿Seguro que quieres rechazar esta invitación?')) {
      this.voluntarioService.updateEstado(this.currentId, 'Rechazada');
      this.cargarDatos();
    }
  }

  desapuntarse() {
    if(confirm('¿Seguro que quieres desapuntarte?')) {
      this.voluntarioService.updateEstado(this.currentId, 'Cancelada');
      this.cargarDatos();
    }
  }

  inscribirse() {
    // Si quiere volver a apuntarse
    this.voluntarioService.updateEstado(this.currentId, 'Aceptada');
    this.cargarDatos();
    alert('¡Te has inscrito correctamente!');
  }
}
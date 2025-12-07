import { Component, input, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-actividad',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './actividad.html',
})
export class Actividad implements OnInit {
  // Input para recibir el ID desde la ruta (Angular 16+)
  // Si usas una versión anterior, avísame y usamos ActivatedRoute clásico.
  // Pero como configuramos withComponentInputBinding() en app.config (suponiendo), esto funciona:
  id = input<string>(); 

  // Datos completos de la actividad
  actividad = signal({
    titulo: 'Residencia Amavir Oblatas',
    organizacion: 'Amavir',
    tipo: 'Social', // Etiqueta azul
    descripcion: 'Transmite tu pasión por ayudar a nuestros mayores a través de los residentes de Residencia Amavir Oblatas. Acompáñanos y disfruta de una tarde de ocio y juegos.',
    requisitos: 'Se busca gente proactiva, con ganas de escuchar y compartir tiempo de calidad.',
    fecha: '01 Jun 2025',
    horario: '16:00 - 18:00',
    ubicacion: 'Residencia Amavir, Pamplona',
    plazasDisponibles: 5,
    apuntado: true, // Para cambiar el texto del botón (Apuntarse vs Desapuntarse)
    
    // Iconos ODS (Simulados)
    ods: [
      { id: 3, nombre: 'Salud y Bienestar', color: 'bg-green-600' },
      { id: 10, nombre: 'Reducción de Desigualdades', color: 'bg-pink-600' }
    ]
  });

  ngOnInit() {
    // Aquí haríamos la llamada al backend usando this.id()
    console.log('Cargando actividad con ID:', this.id());
  }

  toggleInscripcion() {
    // Lógica para apuntarse o desapuntarse
    const actual = this.actividad();
    this.actividad.set({ ...actual, apuntado: !actual.apuntado });
    
    if (actual.apuntado) {
      alert('Te has desapuntado de la actividad');
    } else {
      alert('¡Te has apuntado correctamente!');
    }
  }
}

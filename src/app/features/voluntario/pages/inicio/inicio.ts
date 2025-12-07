import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio.html',
})
export class Inicio {
  // Datos del Usuario (Header azul)
  usuario = signal({
    nombre: 'Juan',
    mensaje: 'Tienes 1 actividad próxima esta semana. ¡Gracias por tu compromiso!'
  });

  // Datos de la Próxima Actividad (Tarjeta izquierda)
  proximaActividad = signal({
    id: 1,
    dia: '12',
    mes: 'JUNIO',
    titulo: 'Recogida de Alimentos',
    horario: '16:00 - 18:00',
    organizacion: 'Cruz Roja'
  });

  // Datos de Impacto (Tarjeta derecha)
  impacto = signal({
    horasTotales: 24,
    mensaje: 'Estás en el top 20% de voluntarios este mes. ¡Sigue así!',
    progreso: 70 // Para la barra de progreso (0 a 100)
  });
}

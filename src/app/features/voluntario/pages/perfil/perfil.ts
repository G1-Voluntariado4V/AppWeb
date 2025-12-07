import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para los inputs (ngModel)

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule], // Importamos FormsModule para editar datos
  templateUrl: './perfil.html',
})
export class Perfil {
  // Datos personales editables
  perfil = signal({
    nombre: 'Juan',
    apellidos: 'García López',
    dni: '12345678X',
    telefono: '600123456',
    curso: '1º DAM',
    horasTotales: 24,
    cochePropio: true, // Toggle switch
    experiencia: 'Voluntario en recogida de alimentos 2023.'
  });

  // Configuración de la tabla de disponibilidad
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  franjas = ['08:00 - 12:00', '12:00 - 16:00', '16:00 - 20:00'];

  // Matriz de disponibilidad (true = seleccionado/azul, false = vacío)
  // Inicializamos todo en false o cargamos datos previos
  disponibilidad = signal<Record<string, boolean>>({
    'Lunes-12:00 - 16:00': true,
    'Martes-08:00 - 12:00': true,
    'Martes-16:00 - 20:00': true,
    // ... el resto se asume false si no está aquí
  });

  // Función para activar/desactivar casillas al hacer click
  toggleDisponibilidad(dia: string, franja: string) {
    const key = `${dia}-${franja}`;
    const currentMap = this.disponibilidad();
    
    // Creamos una copia y actualizamos el valor
    this.disponibilidad.set({
      ...currentMap,
      [key]: !currentMap[key]
    });
  }

  // Verificar si una casilla está activa
  estaDisponible(dia: string, franja: string): boolean {
    return !!this.disponibilidad()[`${dia}-${franja}`];
  }

  guardarCambios() {
    console.log('Guardando perfil...', this.perfil());
    console.log('Nueva disponibilidad...', this.disponibilidad());
    alert('Cambios guardados correctamente');
  }
}

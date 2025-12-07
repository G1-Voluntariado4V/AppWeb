import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

// --- INTERFACES ---

export interface PerfilVoluntario {
  nombre: string;
  apellidos: string;
  dni: string;
  telefono: string;
  curso: string;
  horasTotales: number;
  cochePropio: boolean;
  experiencia: string;
  foto?: string;
}

export interface Actividad {
  id: string; // Cambiado a String para facilitar comparación con URL
  titulo: string;
  organizacion: string;
  fecha: string;
  horario?: string;
  // Estos son los 5 estados exactos de tu Base de Datos
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Finalizada' | 'Cancelada';
  tipo?: string;
  descripcion?: string;
  requisitos?: string;
  ubicacion?: string;
  plazasDisponibles?: number;
  ods?: { id: number; nombre: string; color: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class VoluntarioService {

  // --- MOCK DATA (Tu Base de Datos Maestra) ---

  private mockPerfil: PerfilVoluntario = {
    nombre: 'Juan',
    apellidos: 'García López',
    dni: '12345678X',
    telefono: '600123456',
    curso: '1º DAM',
    horasTotales: 24,
    cochePropio: true,
    experiencia: 'Voluntario en recogida de alimentos 2023.'
  };

  private actividades: Actividad[] = [
    {
      id: '1',
      titulo: 'Recogida de Alimentos',
      organizacion: 'Cruz Roja',
      estado: 'Aceptada',
      fecha: '12 Ene 2025',
      horario: '10:00 - 14:00',
      tipo: 'Social',
      descripcion: 'Ayuda en la clasificación y reparto de alimentos para familias desfavorecidas.',
      ubicacion: 'Banco de Alimentos',
      requisitos: 'Ganas de trabajar en equipo.',
      plazasDisponibles: 10,
      ods: [{ id: 1, nombre: 'Fin de la Pobreza', color: 'bg-red-500' }]
    },
    {
      id: '2',
      titulo: 'Acompañamiento Mayores',
      organizacion: 'Amavir',
      estado: 'Pendiente', // Esta mostrará Aceptar/Rechazar
      fecha: '20 Feb 2025',
      horario: '16:00 - 18:00',
      tipo: 'Social',
      ubicacion: 'Residencia Amavir, Pamplona',
      descripcion: 'Transmite tu pasión por ayudar a nuestros mayores a través de los residentes.',
      requisitos: 'Se busca gente proactiva y empática.',
      ods: [
        { id: 3, nombre: 'Salud y Bienestar', color: 'bg-green-600' },
        { id: 10, nombre: 'Red. Desigualdades', color: 'bg-pink-600' }
      ],
      plazasDisponibles: 5
    },
    {
      id: '3',
      titulo: 'Limpieza Río Arga',
      organizacion: 'Ayuntamiento',
      fecha: '05 Mar 2025',
      estado: 'Rechazada',
      ubicacion: 'Paseo del Arga',
      tipo: 'Medioambiente',
      descripcion: 'Jornada de limpieza de las orillas del río.',
      requisitos: 'Ropa cómoda.',
      plazasDisponibles: 20,
      ods: [{ id: 13, nombre: 'Acción por el Clima', color: 'bg-green-700' }]
    },
    {
      id: '4',
      titulo: 'Banco de Alimentos',
      organizacion: 'Cruz Roja',
      fecha: '10 Mar 2025',
      estado: 'Finalizada',
      tipo: 'Social',
      descripcion: 'Recogida anual.',
      plazasDisponibles: 0
    },
    {
      id: '5',
      titulo: 'Carrera Solidaria',
      organizacion: 'Ayuntamiento',
      fecha: '15 Abr 2025',
      estado: 'Cancelada',
      tipo: 'Deportivo',
      descripcion: 'Carrera benéfica.',
      plazasDisponibles: 50
    }
  ];

  constructor() { }

  // --- MÉTODOS DE GESTIÓN DE ESTADO ---

  /**
   * Devuelve la lista completa (para el Historial)
   */
  getActividades(): Actividad[] {
    return this.actividades;
  }

  /**
   * Busca una actividad por ID (para el Detalle)
   */
  getActividadById(id: string): Actividad | undefined {
    // Convertimos a string por seguridad
    return this.actividades.find(a => String(a.id) === String(id));
  }

  /**
   * ACTUALIZA el estado en la "Base de Datos"
   * Esto hace que el cambio persista al salir y volver a entrar
   */
  updateEstado(id: string, nuevoEstado: 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Finalizada' | 'Cancelada'): void {
    const actividad = this.actividades.find(a => String(a.id) === String(id));
    if (actividad) {
      actividad.estado = nuevoEstado;
      console.log(`[Servicio] Estado actualizado: ID ${id} -> ${nuevoEstado}`);
    }
  }

  // --- MÉTODOS DE PERFIL (Mantenemos la compatibilidad) ---

  getPerfil(): Observable<PerfilVoluntario> {
    return of(this.mockPerfil).pipe(delay(500));
  }

  updatePerfil(datos: PerfilVoluntario): Observable<boolean> {
    this.mockPerfil = datos;
    return of(true).pipe(delay(500));
  }
}
import { Injectable, signal } from '@angular/core';
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
  foto?: string; // La foto es opcional (string base64)
}

export interface Actividad {
  id: string;
  titulo: string;
  organizacion: string;
  fecha: string;
  horario?: string;
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

  // 1. ESTADO GLOBAL REACTIVO (Signal)
  // Al guardarlo aquí como signal, cualquier componente que lo lea se actualizará solo.
  perfilSignal = signal<PerfilVoluntario>({
    nombre: 'Juan',
    apellidos: 'García López',
    dni: '12345678X',
    telefono: '600123456',
    curso: '1º DAM',
    horasTotales: 24,
    cochePropio: true,
    experiencia: 'Voluntario en recogida de alimentos 2023.',
    foto: '' // Empieza sin foto
  });

  private actividades: Actividad[] = [
    {
      id: '1',
      titulo: 'Recogida de Alimentos',
      organizacion: 'Cruz Roja',
      estado: 'Aceptada',
      fecha: '12 Ene 2025',
      horario: '10:00 - 14:00',
      tipo: 'Social',
      descripcion: 'Ayuda en la clasificación y reparto de alimentos.',
      requisitos: 'Ganas de trabajar en equipo.',
      ubicacion: 'Banco de Alimentos',
      plazasDisponibles: 10,
      ods: [{ id: 1, nombre: 'Fin de la Pobreza', color: 'bg-red-500' }]
    },
    {
      id: '2',
      titulo: 'Acompañamiento Mayores',
      organizacion: 'Amavir',
      estado: 'Pendiente',
      fecha: '20 Feb 2025',
      horario: '16:00 - 18:00',
      tipo: 'Social',
      ubicacion: 'Residencia Amavir, Pamplona',
      descripcion: 'Transmite tu pasión por ayudar a nuestros mayores.',
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
      descripcion: 'Jornada de limpieza.',
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

  // --- MÉTODOS DE ACTIVIDADES ---

  getActividades(): Actividad[] {
    return this.actividades;
  }

  getActividadById(id: string): Actividad | undefined {
    return this.actividades.find(a => String(a.id) === String(id));
  }

  updateEstado(id: string, nuevoEstado: any): void {
    const actividad = this.actividades.find(a => String(a.id) === String(id));
    if (actividad) {
      actividad.estado = nuevoEstado;
    }
  }

  // --- MÉTODOS DE PERFIL (ACTUALIZADOS) ---

  // Devuelve un observable del valor actual (para que Perfil.ts cargue al inicio)
  getPerfil(): Observable<PerfilVoluntario> {
    return of(this.perfilSignal()); 
  }

  // Actualiza la Signal globalmente
  updatePerfil(datos: PerfilVoluntario): Observable<boolean> {
    this.perfilSignal.set(datos); // <--- AQUÍ OCURRE LA MAGIA. Se actualiza en todos lados.
    console.log('Perfil actualizado globalmente:', datos);
    return of(true);
  }
}
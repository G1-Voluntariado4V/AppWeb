import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

// Definimos interfaces para que TypeScript nos ayude (puedes moverlas a shared/models si prefieres)
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
  id: number;
  titulo: string;
  organizacion: string;
  fecha: string; // O Date
  horario?: string;
  estado: 'Finalizada' | 'En curso' | 'Cancelada' | 'Próxima';
  tipo?: string;
  descripcion?: string;
  requisitos?: string;
  ubicacion?: string;
  plazasDisponibles?: number;
  apuntado?: boolean;
  ods?: { id: number; nombre: string; color: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class VoluntarioService {

  // --- MOCK DATA (Simulación de Base de Datos) ---

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

  private mockActividades: Actividad[] = [
    {
      id: 1,
      titulo: 'Recogida de Alimentos',
      organizacion: 'Cruz Roja',
      fecha: '12 Jun 2025',
      horario: '16:00 - 18:00',
      estado: 'Próxima',
      tipo: 'Social',
      descripcion: 'Ayuda en la clasificación y reparto de alimentos para familias desfavorecidas.',
      ubicacion: 'Banco de Alimentos',
      plazasDisponibles: 10,
      apuntado: false
    },
    {
      id: 2,
      titulo: 'Acompañamiento Mayores',
      organizacion: 'Amavir',
      fecha: '20 Feb 2025',
      estado: 'En curso',
      tipo: 'Acompañamiento',
      ubicacion: 'Residencia Amavir',
      descripcion: 'Transmite tu pasión por ayudar a nuestros mayores...',
      ods: [
        { id: 3, nombre: 'Salud y Bienestar', color: 'bg-green-600' },
        { id: 10, nombre: 'Red. Desigualdades', color: 'bg-pink-600' }
      ],
      plazasDisponibles: 5,
      apuntado: true
    },
    {
      id: 3,
      titulo: 'Limpieza Río Arga',
      organizacion: 'Ayuntamiento',
      fecha: '05 Mar 2025',
      estado: 'Cancelada',
      ubicacion: 'Paseo del Arga',
      tipo: 'Medioambiente'
    },
    {
      id: 4,
      titulo: 'Recogida de Juguetes',
      organizacion: 'Cruz Roja',
      fecha: '10 Ene 2025',
      estado: 'Finalizada',
      tipo: 'Social'
    }
  ];

  constructor() { }

  // --- MÉTODOS DEL SERVICIO ---

  /**
   * Obtiene el perfil del usuario logueado
   */
  getPerfil(): Observable<PerfilVoluntario> {
    // Usamos 'of' y 'delay' para simular que tarda un poco como una API real
    return of(this.mockPerfil).pipe(delay(500));
  }

  /**
   * Actualiza el perfil
   */
  updatePerfil(datos: PerfilVoluntario): Observable<boolean> {
    this.mockPerfil = datos;
    console.log('Servicio: Perfil actualizado', this.mockPerfil);
    return of(true).pipe(delay(500));
  }

  /**
   * Obtiene todas las actividades (historial)
   */
  getActividades(): Observable<Actividad[]> {
    return of(this.mockActividades).pipe(delay(300));
  }

  /**
   * Obtiene la próxima actividad destacada (para el Dashboard)
   */
  getProximaActividad(): Observable<Actividad | undefined> {
    const proxima = this.mockActividades.find(a => a.estado === 'Próxima');
    return of(proxima).pipe(delay(300));
  }

  /**
   * Obtiene el detalle de una actividad por ID
   */
  getActividadById(id: number): Observable<Actividad | undefined> {
    const actividad = this.mockActividades.find(a => a.id === id);
    return of(actividad).pipe(delay(200));
  }

  /**
   * Simula apuntarse o desapuntarse
   */
  toggleInscripcion(id: number): Observable<boolean> {
    const act = this.mockActividades.find(a => a.id === id);
    if (act) {
      act.apuntado = !act.apuntado;
      return of(act.apuntado).pipe(delay(400));
    }
    return of(false);
  }
}
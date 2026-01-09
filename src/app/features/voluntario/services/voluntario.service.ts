import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BackendUser } from '../../../shared/models/interfaces/backend-user';
import { environment } from '../../../../environments/environment';

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
  foto?: string; // Foto de Google (prioridad) o del backend
  email?: string;
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

// Interface para la respuesta del backend
interface VoluntarioPerfilResponse {
  nombre?: string | null;
  apellidos?: string | null;
  dni?: string | null;
  telefono?: string | null;
  fecha_nac?: string | null;
  carnet_conducir?: boolean;
  img_perfil?: string | null;
  curso_actual?: { nombre?: string } | null;
  usuario?: {
    id_usuario?: number;
    correo?: string;
    estado_cuenta?: string;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class VoluntarioService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private googlePhoto: string | null = null;
  private googleEmail: string | null = null;
  private perfilCargadoPara: number | null = null;

  // 1. ESTADO GLOBAL REACTIVO (Signal)
  perfilSignal = signal<PerfilVoluntario>({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    curso: '',
    horasTotales: 0,
    cochePropio: false,
    experiencia: '',
    foto: '',
    email: ''
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

  constructor() {
    // Obtener foto y correo de Google
    this.googlePhoto = this.authService.getGooglePhoto();
    this.googleEmail = this.authService.getGoogleEmail();

    // Escuchar cambios en el backend user
    this.authService.backendUser$.subscribe((backendUser) => {
      if (backendUser?.id_usuario && backendUser.rol?.toLowerCase().includes('voluntar')) {
        this.cargarPerfilDesdeBackend(backendUser);
      }
    });

    // Escuchar cambios en Firebase para la foto y correo
    this.authService.user$.subscribe((firebaseUser) => {
      if (firebaseUser?.photoURL) {
        this.googlePhoto = firebaseUser.photoURL;
      }
      if (firebaseUser?.email) {
        this.googleEmail = firebaseUser.email;
      }
      
      this.perfilSignal.update(actual => ({
        ...actual,
        foto: this.googlePhoto ?? actual.foto,
        email: this.googleEmail ?? actual.email
      }));
    });
  }

  private cargarPerfilDesdeBackend(backendUser: BackendUser) {
    if (!backendUser.id_usuario) return;
    if (this.perfilCargadoPara === backendUser.id_usuario) return;

    this.perfilCargadoPara = backendUser.id_usuario;

    this.http
      .get<VoluntarioPerfilResponse>(`${environment.apiUrl}/voluntarios/${backendUser.id_usuario}`)
      .subscribe({
        next: (respuesta) => {
          this.perfilSignal.set(this.mapearPerfil(respuesta, backendUser));
        },
        error: () => {
          // Fallback: usar datos del backendUser directamente
          this.perfilSignal.update(actual => ({
            ...actual,
            nombre: backendUser.nombre || actual.nombre,
            apellidos: backendUser.apellidos || actual.apellidos,
            email: this.googleEmail ?? backendUser.correo ?? actual.email,
            telefono: backendUser.telefono || actual.telefono,
            foto: this.googlePhoto ?? backendUser.img_perfil ?? actual.foto,
          }));
        },
      });
  }

  private mapearPerfil(respuesta: VoluntarioPerfilResponse, backendUser: BackendUser): PerfilVoluntario {
    return {
      nombre: respuesta.nombre || backendUser.nombre || '',
      apellidos: respuesta.apellidos || backendUser.apellidos || '',
      dni: respuesta.dni || backendUser.dni || '',
      telefono: respuesta.telefono || backendUser.telefono || '',
      curso: respuesta.curso_actual?.nombre || backendUser.curso || '',
      horasTotales: 0, // TODO: Obtener del backend cuando esté disponible
      cochePropio: respuesta.carnet_conducir ?? backendUser.carnet_conducir ?? false,
      experiencia: '', // TODO: Obtener del backend
      foto: this.googlePhoto ?? respuesta.img_perfil ?? backendUser.img_perfil ?? '',
      email: this.googleEmail ?? respuesta.usuario?.correo ?? backendUser.correo ?? ''  // Google tiene prioridad
    };
  }

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

  // --- MÉTODOS DE PERFIL ---

  getPerfil(): Observable<PerfilVoluntario> {
    return of(this.perfilSignal()); 
  }

  updatePerfil(datos: PerfilVoluntario): Observable<boolean> {
    this.perfilSignal.set(datos);
    console.log('Perfil actualizado globalmente:', datos);
    return of(true);
  }
}
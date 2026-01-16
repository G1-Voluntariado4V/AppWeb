import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map, tap, forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BackendUser } from '../../../shared/models/interfaces/backend-user';
import { environment } from '../../../../environments/environment';

// --- INTERFACES ---
export interface PerfilVoluntario {
  id_usuario: number;
  nombre: string;
  apellidos: string;
  dni: string;
  telefono: string;
  curso: string;
  fecha_nac: string;
  horasTotales: number;
  carnetConducir: boolean;
  descripcion: string;
  experiencia: string;
  foto?: string;
  email?: string;
  preferencias?: { id: number; nombre: string }[];
}

export interface ActividadDisponible {
  id_actividad: number;
  titulo: string;
  descripcion: string;
  organizacion: string;
  id_organizacion: number;
  ubicacion: string;
  fecha_inicio: string;
  duracion_horas: number;
  cupo_maximo: number;
  voluntarios_inscritos: number;
  estado_publicacion: string;
  tipos?: string[];
  ods?: { id: number; nombre: string; color: string }[];
  // Estado de inscripción del voluntario actual
  inscrito?: boolean;
  estadoInscripcion?: 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Finalizada' | 'Cancelada' | null;
}

export interface MiActividad {
  id_actividad: number;
  titulo: string;
  descripcion: string;
  organizacion: string;
  ubicacion: string;
  fecha_inicio: string;
  duracion_horas: number;
  estado_solicitud: 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Finalizada' | 'Cancelada';
  fecha_solicitud: string;
  tipos?: string[];
  ods?: { id: number; nombre: string }[];
}

export interface HistorialResponse {
  resumen: {
    total_participaciones: number;
    horas_acumuladas: number;
    nivel_experiencia: string;
  };
  actividades: MiActividad[];
}

export interface EstadisticasVoluntario {
  horasTotales: number;
  actividadesCompletadas: number;
  actividadesPendientes: number;
  actividadesAceptadas: number;
  nivelExperiencia: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoluntarioService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Signals para estado reactivo
  perfil = signal<PerfilVoluntario | null>(null);
  actividadesDisponibles = signal<ActividadDisponible[]>([]);
  misActividades = signal<MiActividad[]>([]);
  estadisticas = signal<EstadisticasVoluntario>({
    horasTotales: 0,
    actividadesCompletadas: 0,
    actividadesPendientes: 0,
    actividadesAceptadas: 0,
    nivelExperiencia: 'Principiante'
  });

  cargando = signal(false);
  error = signal<string | null>(null);

  // Computed para datos derivados
  proximaActividad = computed(() => {
    const actividades = this.misActividades();
    return actividades.find(a => a.estado_solicitud === 'Aceptada' || a.estado_solicitud === 'Pendiente') || null;
  });

  actividadesActivas = computed(() => {
    return this.misActividades().filter(a =>
      a.estado_solicitud === 'Aceptada' || a.estado_solicitud === 'Pendiente'
    );
  });

  private get userId(): number | null {
    const backendUser = this.authService.getBackendUserSnapshot();
    return backendUser?.id_usuario || null;
  }

  private getHeaders(): HttpHeaders {
    const userId = this.userId;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-User-Id': userId ? userId.toString() : ''
    });
  }

  constructor() {
    // Cargar datos cuando cambie el usuario
    this.authService.backendUser$.subscribe((backendUser) => {
      if (backendUser?.id_usuario && this.isVoluntario(backendUser)) {
        this.cargarTodo();
      }
    });
  }

  private isVoluntario(user: BackendUser): boolean {
    const rol = user.rol?.toLowerCase() || '';
    return rol.includes('voluntar');
  }

  // ==========================================
  // CARGAR TODOS LOS DATOS
  // ==========================================
  cargarTodo(): void {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      perfil: this.cargarPerfilAPI(),
      actividades: this.cargarActividadesDisponiblesAPI(),
      historial: this.cargarHistorialAPI(),
      horas: this.cargarHorasTotalesAPI()
    }).subscribe({
      next: (results) => {
        if (results.perfil) {
          this.perfil.set(results.perfil);
        }
        if (results.actividades) {
          this.actividadesDisponibles.set(results.actividades);
        }
        if (results.historial) {
          const historial = results.historial;
          this.misActividades.set(historial.actividades || []);
          this.estadisticas.update(stats => ({
            ...stats,
            actividadesCompletadas: historial.resumen?.total_participaciones || 0,
            nivelExperiencia: historial.resumen?.nivel_experiencia || 'Principiante',
            horasTotales: historial.resumen?.horas_acumuladas || 0
          }));
        }
        if (results.horas !== null) {
          this.estadisticas.update(stats => ({
            ...stats,
            horasTotales: results.horas || 0
          }));
        }

        // Calcular estadísticas adicionales
        this.calcularEstadisticas();

        // Marcar actividades en las que ya está inscrito
        this.marcarActividadesInscritas();

        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando datos:', err);
        this.error.set('Error al cargar los datos. Intenta recargar la página.');
        this.cargando.set(false);
      }
    });
  }

  private calcularEstadisticas(): void {
    const actividades = this.misActividades();
    this.estadisticas.update(stats => ({
      ...stats,
      actividadesPendientes: actividades.filter(a => a.estado_solicitud === 'Pendiente').length,
      actividadesAceptadas: actividades.filter(a => a.estado_solicitud === 'Aceptada').length,
      actividadesCompletadas: actividades.filter(a =>
        a.estado_solicitud === 'Aceptada' || a.estado_solicitud === 'Finalizada'
      ).length
    }));
  }

  private marcarActividadesInscritas(): void {
    const misActs = this.misActividades();
    const disponibles = this.actividadesDisponibles();

    const actualizadas = disponibles.map(act => {
      const inscripcion = misActs.find(mi => mi.id_actividad === act.id_actividad);
      const estado = inscripcion?.estado_solicitud;
      // Solo mapear estados válidos para ActividadDisponible
      const estadoValido = estado === 'Pendiente' || estado === 'Aceptada' || estado === 'Rechazada' || estado === 'Finalizada' || estado === 'Cancelada' ? estado : null;
      return {
        ...act,
        inscrito: !!inscripcion,
        estadoInscripcion: estadoValido
      } as ActividadDisponible;
    });

    this.actividadesDisponibles.set(actualizadas);
  }

  // ==========================================
  // API CALLS
  // ==========================================

  private cargarPerfilAPI(): Observable<PerfilVoluntario | null> {
    const userId = this.userId;
    if (!userId) return of(null);

    return this.http.get<any>(`${environment.apiUrl}/voluntarios/${userId}`).pipe(
      map(response => this.mapearPerfil(response)),
      catchError(err => {
        console.error('Error cargando perfil:', err);
        return of(null);
      })
    );
  }

  private cargarActividadesDisponiblesAPI(): Observable<ActividadDisponible[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/actividades`).pipe(
      map(response => response.map(act => this.mapearActividadDisponible(act))),
      catchError(err => {
        console.error('Error cargando actividades:', err);
        return of([]);
      })
    );
  }

  private cargarHistorialAPI(): Observable<HistorialResponse | null> {
    const userId = this.userId;
    if (!userId) return of(null);

    return this.http.get<HistorialResponse>(
      `${environment.apiUrl}/voluntarios/${userId}/historial`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('📜 Historial RAW del backend:', response)),
      map(response => {
        const mapped = {
          resumen: response.resumen || { total_participaciones: 0, horas_acumuladas: 0, nivel_experiencia: 'Principiante' },
          actividades: (response.actividades || []).map(act => {
            console.log('📝 Actividad RAW:', act);
            return this.mapearMiActividad(act);
          })
        };
        console.log('📜 Historial MAPEADO:', mapped);
        return mapped;
      }),
      catchError(err => {
        console.error('Error cargando historial:', err);
        return of(null);
      })
    );
  }

  private cargarHorasTotalesAPI(): Observable<number | null> {
    const userId = this.userId;
    if (!userId) return of(null);

    return this.http.get<{ horas_totales: number }>(
      `${environment.apiUrl}/voluntarios/${userId}/horas-totales`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.horas_totales || 0),
      catchError(err => {
        console.error('Error cargando horas:', err);
        return of(0);
      })
    );
  }

  // ==========================================
  // INSCRIPCIÓN / DESINSCRIPCIÓN
  // ==========================================

  inscribirse(idActividad: number): Observable<{ success: boolean; mensaje: string }> {
    const userId = this.userId;
    console.log('📝 Inscribirse - userId:', userId, 'actividadId:', idActividad);

    if (!userId) {
      console.error('❌ No se ha identificado el usuario');
      return of({ success: false, mensaje: 'No se ha identificado el usuario' });
    }

    const url = `${environment.apiUrl}/voluntarios/${userId}/actividades/${idActividad}`;
    const headers = this.getHeaders();
    console.log('📤 POST a:', url);
    console.log('📤 Headers:', { 'X-User-Id': userId.toString() });

    return this.http.post<any>(url, {}, { headers }).pipe(
      tap((response) => {
        console.log('✅ Inscripción exitosa:', response);
        // Actualizar estado local
        this.actividadesDisponibles.update(acts =>
          acts.map(act =>
            act.id_actividad === idActividad
              ? { ...act, inscrito: true, estadoInscripcion: 'Pendiente' as const }
              : act
          )
        );
        // Recargar historial
        this.cargarHistorialAPI().subscribe(historial => {
          if (historial) {
            this.misActividades.set(historial.actividades);
            this.calcularEstadisticas();
          }
        });
      }),
      map(response => ({ success: true, mensaje: response.mensaje || 'Inscripción realizada' })),
      catchError(err => {
        console.error('❌ Error en inscripción:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Error body:', err.error);
        const mensaje = err.error?.error || err.error?.mensaje || `Error al inscribirse (${err.status || 'desconocido'})`;
        return of({ success: false, mensaje });
      })
    );
  }

  desapuntarse(idActividad: number): Observable<{ success: boolean; mensaje: string }> {
    const userId = this.userId;
    if (!userId) {
      return of({ success: false, mensaje: 'No se ha identificado el usuario' });
    }

    return this.http.delete<any>(
      `${environment.apiUrl}/voluntarios/${userId}/actividades/${idActividad}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        // Actualizar estado local
        this.actividadesDisponibles.update(acts =>
          acts.map(act =>
            act.id_actividad === idActividad
              ? { ...act, inscrito: false, estadoInscripcion: null }
              : act
          )
        );
        // Quitar de mis actividades
        this.misActividades.update(acts =>
          acts.filter(act => act.id_actividad !== idActividad)
        );
        this.calcularEstadisticas();
      }),
      map(response => ({ success: true, mensaje: response.mensaje || 'Te has desapuntado' })),
      catchError(err => {
        const mensaje = err.error?.error || err.error?.mensaje || 'Error al desapuntarse';
        return of({ success: false, mensaje });
      })
    );
  }

  // ==========================================
  // ACTUALIZAR PERFIL
  // ==========================================

  actualizarPerfil(datos: Partial<PerfilVoluntario>): Observable<{ success: boolean; mensaje: string }> {
    const userId = this.userId;
    if (!userId) {
      return of({ success: false, mensaje: 'No se ha identificado el usuario' });
    }

    const payload = {
      nombre: datos.nombre,
      apellidos: datos.apellidos,
      telefono: datos.telefono,
      fechaNac: datos.fecha_nac,
      descripcion: datos.descripcion,
      preferencias_ids: datos.preferencias?.map(p => p.id) || []
    };

    return this.http.put<any>(
      `${environment.apiUrl}/voluntarios/${userId}`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        // Actualizar perfil local
        this.perfil.update(current => current ? { ...current, ...datos } : null);
      }),
      map(() => ({ success: true, mensaje: 'Perfil actualizado correctamente' })),
      catchError(err => {
        const mensaje = err.error?.error || 'Error al actualizar el perfil';
        return of({ success: false, mensaje });
      })
    );
  }

  // ==========================================
  // RECOMENDACIONES
  // ==========================================

  getRecomendaciones(): Observable<ActividadDisponible[]> {
    const userId = this.userId;
    if (!userId) return of([]);

    return this.http.get<any[]>(
      `${environment.apiUrl}/voluntarios/${userId}/recomendaciones`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.map(act => this.mapearActividadDisponible(act))),
      catchError(err => {
        console.error('Error cargando recomendaciones:', err);
        return of([]);
      })
    );
  }

  // ==========================================
  // MAPPERS
  // ==========================================

  private mapearPerfil(response: any): PerfilVoluntario {
    const googlePhoto = this.authService.getGooglePhoto();
    const googleEmail = this.authService.getGoogleEmail();

    return {
      id_usuario: response.usuario?.id_usuario || response.id_usuario || 0,
      nombre: response.nombre || '',
      apellidos: response.apellidos || '',
      dni: response.dni || '',
      telefono: response.telefono || '',
      curso: response.curso_actual?.nombre || response.curso || '',
      fecha_nac: response.fecha_nac || '',
      horasTotales: 0,
      carnetConducir: response.carnet_conducir || false,
      descripcion: response.descripcion || '',
      experiencia: '',
      foto: googlePhoto || response.img_perfil || '',
      email: googleEmail || response.usuario?.correo || response.correo || '',
      preferencias: response.preferencias || []
    };
  }

  private mapearActividadDisponible(act: any): ActividadDisponible {
    return {
      id_actividad: act.id_actividad || act.id,
      titulo: act.titulo || '',
      descripcion: act.descripcion || '',
      organizacion: act.organizacion || act.nombre_organizacion || '',
      id_organizacion: act.id_organizacion || 0,
      ubicacion: act.ubicacion || '',
      fecha_inicio: act.fecha_inicio || '',
      duracion_horas: act.duracion_horas || 0,
      cupo_maximo: act.cupo_maximo || 0,
      voluntarios_inscritos: act.inscritos_confirmados || act.voluntarios_inscritos || 0,
      estado_publicacion: act.estado_publicacion || 'Publicada',
      tipos: act.tipos || [],
      ods: act.ods || [],
      inscrito: false,
      estadoInscripcion: null
    };
  }

  private mapearMiActividad(act: any): MiActividad {
    // El backend devuelve: id_actividad, titulo_actividad, fecha_actividad, estado, fecha_solicitud
    return {
      id_actividad: act.id_actividad || 0,
      titulo: act.titulo_actividad || act.titulo || '',
      descripcion: act.descripcion || '',
      organizacion: act.organizacion || act.nombre_organizacion || '',
      ubicacion: act.ubicacion || '',
      fecha_inicio: act.fecha_actividad || act.fecha_inicio || '',
      duracion_horas: act.duracion_horas || 0,
      estado_solicitud: act.estado || act.estado_solicitud || 'Pendiente',
      fecha_solicitud: act.fecha_solicitud || '',
      tipos: act.tipos || [],
      ods: act.ods || []
    };
  }

  // ==========================================
  // GETTERS PARA COMPATIBILIDAD
  // ==========================================

  get perfilSignal() {
    return computed(() => {
      const p = this.perfil();
      if (!p) return {
        nombre: '',
        apellidos: '',
        dni: '',
        telefono: '',
        curso: '',
        horasTotales: 0,
        cochePropio: false,
        experiencia: '',
        foto: this.authService.getGooglePhoto() || '',
        email: this.authService.getGoogleEmail() || ''
      };

      return {
        nombre: p.nombre,
        apellidos: p.apellidos,
        dni: p.dni,
        telefono: p.telefono,
        curso: p.curso,
        horasTotales: this.estadisticas().horasTotales,
        cochePropio: p.carnetConducir,
        experiencia: p.descripcion,
        foto: p.foto || this.authService.getGooglePhoto() || '',
        email: p.email || this.authService.getGoogleEmail() || ''
      };
    });
  }

  getActividades() {
    return this.misActividades().map(act => ({
      id: act.id_actividad.toString(),
      titulo: act.titulo,
      organizacion: act.organizacion,
      fecha: this.formatearFecha(act.fecha_inicio),
      horario: `${act.duracion_horas}h`,
      estado: act.estado_solicitud,
      tipo: act.tipos?.[0] || '',
      descripcion: act.descripcion,
      ubicacion: act.ubicacion,
      ods: act.ods
    }));
  }

  private formatearFecha(fecha: string): string {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      const dia = date.getDate();
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const mes = meses[date.getMonth()];
      const año = date.getFullYear();
      return `${dia} ${mes} ${año}`;
    } catch {
      return fecha;
    }
  }
}

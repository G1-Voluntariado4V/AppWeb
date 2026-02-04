import { Injectable, signal, inject, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  id_curso_actual?: number;
  fecha_nac: string;
  horasTotales: number;
  carnetConducir: boolean;
  descripcion: string;
  experiencia: string;
  foto?: string;
  email?: string;
  preferencias?: { id: number; nombre: string }[];
  idiomas?: IdiomaVoluntario[];
}

export interface IdiomaVoluntario {
  id_idioma: number;
  idioma: string;
  nivel: string;
}

export interface Idioma {
  id: number;
  nombre: string;
  codigo_iso?: string;
}

export interface Curso {
  id: number;
  nombre: string;
}

export interface TipoVoluntariado {
  id: number;
  nombreTipo: string;
}

export interface OdsCatalogo {
  id: number;
  nombre: string;
  descripcion?: string;
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
  ods?: { id: number; nombre: string; color?: string }[];
  // Estado de inscripción del voluntario actual
  inscrito?: boolean;
  estadoInscripcion?: 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Finalizada' | 'Cancelada' | null;
  imagen?: string;
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
  imagen?: string;
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
  private destroyRef = inject(DestroyRef);

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

  // Catálogos
  idiomasCatalogo = signal<Idioma[]>([]);
  cursosCatalogo = signal<Curso[]>([]);
  tiposCatalogo = signal<TipoVoluntariado[]>([]);
  odsCatalogo = signal<OdsCatalogo[]>([]);

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
    // Cargar catálogos al iniciar
    this.cargarCatalogos();

    // Cargar datos cuando cambie el usuario - con cleanup automático
    this.authService.backendUser$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((backendUser) => {
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
      historial: this.cargarHistorialAPI()
    }).subscribe({
      next: (results) => {
        if (results.perfil) {
          this.perfil.set(results.perfil);
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

        // Calcular estadísticas adicionales
        this.calcularEstadisticas();

        // Si ya había actividades cargadas, actualizar su estado de inscripción
        if (this.actividadesDisponibles().length > 0) {
          this.marcarActividadesInscritas();
        }

        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando datos:', err);
        this.error.set('Error al cargar los datos. Intenta recargar la página.');
        this.cargando.set(false);
      }
    });
  }

  cargarActividadesDisponibles(): void {
    this.cargando.set(true);
    this.cargarActividadesDisponiblesAPI().subscribe(actividades => {
      this.actividadesDisponibles.set(actividades);
      this.marcarActividadesInscritas();
      this.cargando.set(false);
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
      map(response => {

        return response.map(act => this.mapearActividadDisponible(act));
      }),
      catchError(err => {
        console.error('Error cargando actividades:', err);
        return of([]);
      })
    );
  }

  // Cargar actividades con filtros de servidor (para ODS y Tipo)
  cargarActividadesConFiltros(odsId?: number, tipoId?: number): Observable<ActividadDisponible[]> {
    let url = `${environment.apiUrl}/actividades`;
    const params: string[] = [];

    if (odsId && odsId > 0) {
      params.push(`ods_id=${odsId}`);
    }
    if (tipoId && tipoId > 0) {
      params.push(`tipo_id=${tipoId}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }



    return this.http.get<any[]>(url).pipe(
      map(response => {
        const actividades = response.map(act => this.mapearActividadDisponible(act));

        return actividades;
      }),
      catchError(err => {
        console.error('Error cargando actividades con filtros:', err);
        return of([]);
      })
    );
  }

  // Obtener detalle completo de una actividad (incluye ODS y tipos)
  getDetalleActividad(idActividad: number): Observable<ActividadDisponible | null> {
    return this.http.get<any>(`${environment.apiUrl}/actividades/${idActividad}`).pipe(
      map(response => {

        // Mapear tipos (vienen como array de objetos {id, nombre})
        const tipos: string[] = [];
        if (response.tipos && Array.isArray(response.tipos)) {
          response.tipos.forEach((t: any) => {
            if (typeof t === 'string') {
              tipos.push(t);
            } else if (t.nombre) {
              tipos.push(t.nombre);
            } else if (t.nombreTipo) {
              tipos.push(t.nombreTipo);
            }
          });
        }

        // Mapear ODS (vienen como array de objetos {id, nombre})
        const ods: { id: number; nombre: string; color?: string }[] = [];
        if (response.ods && Array.isArray(response.ods)) {
          response.ods.forEach((o: any) => {
            ods.push({
              id: o.id,
              nombre: o.nombre || `ODS ${o.id}`,
              color: undefined
            });
          });
        }

        // Verificar estado de inscripción del voluntario actual
        const actividades = this.actividadesDisponibles();
        const actExistente = actividades.find(a => a.id_actividad === response.id);

        return {
          id_actividad: response.id,
          titulo: response.titulo,
          descripcion: response.descripcion || '',
          organizacion: response.nombre_organizacion || 'Desconocida',
          id_organizacion: response.id_organizacion || 0,
          ubicacion: response.ubicacion || 'No especificada',
          fecha_inicio: response.fecha_inicio || '',
          duracion_horas: response.duracion_horas || 0,
          cupo_maximo: response.cupo_maximo || 0,
          voluntarios_inscritos: response.inscritos_confirmados || 0,
          estado_publicacion: response.estado_publicacion || 'Publicada',
          tipos: tipos,
          ods: ods,
          inscrito: actExistente?.inscrito || false,
          estadoInscripcion: actExistente?.estadoInscripcion || null
        } as ActividadDisponible;
      }),
      catchError(err => {
        console.error('Error obteniendo detalle de actividad:', err);
        return of(null);
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
      map(response => {
        return {
          resumen: response.resumen || { total_participaciones: 0, horas_acumuladas: 0, nivel_experiencia: 'Principiante' },
          actividades: (response.actividades || []).map(act => this.mapearMiActividad(act))
        };
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

    if (!userId) {
      return of({ success: false, mensaje: 'No se ha identificado el usuario' });
    }

    const url = `${environment.apiUrl}/voluntarios/${userId}/actividades/${idActividad}`;
    const headers = this.getHeaders();

    return this.http.post<any>(url, {}, { headers }).pipe(
      tap(() => {
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
        let mensaje = err.error?.error || err.error?.mensaje || `Error al inscribirse (${err.status || 'desconocido'})`;

        // Forzar detección de conflicto
        if (err.status === 409) {
          mensaje = `409 Conflict: ${mensaje}`;
        }

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
        let mensaje = err.error?.error || err.error?.mensaje || `Error al desapuntarse (${err.status || 'desconocido'})`;

        // Forzar detección de 404
        if (err.status === 404) {
          mensaje = `404 Not Found: ${mensaje}`;
        }

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
      carnet_conducir: datos.carnetConducir,
      id_curso_actual: datos.id_curso_actual,
      preferencias_ids: datos.preferencias?.map(p => p.id) || []
    };

    return this.http.put<any>(
      `${environment.apiUrl}/voluntarios/${userId}`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        // Actualizar perfil local con la respuesta del backend para tener datos frescos (ej: nombre del curso)
        const perfilActualizado = this.mapearPerfil(response);
        this.perfil.set(perfilActualizado);
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

  getOrganizacion(id: number): Observable<any> {
    // Nota: El backend en /organizaciones/{id} espera el ID de usuario, no el ID de organización como entidad (si son el mismo)
    // Asumimos que id_organizacion en ActividadDisponible es el ID de usuario de la org
    return this.http.get<any>(`${environment.apiUrl}/organizaciones/${id}`).pipe(
      catchError(err => {
        console.error('Error cargando organización:', err);
        return of(null);
      })
    );
  }

  // ==========================================
  // CATÁLOGOS
  // ==========================================

  cargarCatalogos(): void {
    // Cargar idiomas
    this.http.get<any[]>(`${environment.apiUrl}/catalogos/idiomas`).pipe(
      catchError(() => of([]))
    ).subscribe(data => {
      this.idiomasCatalogo.set(data.map(i => ({
        id: i.id || i.id_idioma,
        nombre: i.nombre,
        codigo_iso: i.codigo_iso
      })));
    });

    // Cargar cursos
    this.http.get<any[]>(`${environment.apiUrl}/catalogos/cursos`).pipe(
      catchError(() => of([]))
    ).subscribe(data => {
      this.cursosCatalogo.set(data.map(c => ({
        id: c.id || c.id_curso,
        nombre: c.nombre
      })));
    });

    // Cargar tipos de voluntariado
    this.http.get<any[]>(`${environment.apiUrl}/catalogos/tipos-voluntariado`).pipe(
      catchError((err) => {
        console.error('Error cargando tipos de voluntariado:', err);
        return of([]);
      })
    ).subscribe(data => {

      const tipos = data.map(t => ({
        id: Number(t.id),
        nombreTipo: t.nombreTipo || t.nombre || ''
      })).filter(t => t.nombreTipo.length > 0);

      this.tiposCatalogo.set(tipos);
    });

    // Cargar ODS
    this.http.get<any[]>(`${environment.apiUrl}/ods`).pipe(
      catchError((err) => {
        console.error('Error cargando ODS:', err);
        return of([]);
      })
    ).subscribe(data => {

      const ods = data.map(o => ({
        id: Number(o.id),
        nombre: o.nombre || '',
        descripcion: o.descripcion || ''
      })).filter(o => o.nombre.length > 0);

      this.odsCatalogo.set(ods);
    });
  }

  // ==========================================
  // GESTIÓN DE IDIOMAS
  // ==========================================

  agregarIdioma(idIdioma: number, nivel: string): Observable<{ success: boolean; mensaje: string }> {
    const userId = this.userId;
    if (!userId) return of({ success: false, mensaje: 'Usuario no identificado' });

    return this.http.post<any>(
      `${environment.apiUrl}/voluntarios/${userId}/idiomas`,
      { id_idioma: idIdioma, nivel },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        // Actualizar perfil local añadiendo el idioma
        const idiomaNombre = this.idiomasCatalogo().find(i => i.id === idIdioma)?.nombre || '';
        this.perfil.update(p => p ? {
          ...p,
          idiomas: [...(p.idiomas || []), { id_idioma: idIdioma, idioma: idiomaNombre, nivel }]
        } : null);
      }),
      map(res => ({ success: true, mensaje: res.mensaje || 'Idioma añadido' })),
      catchError(err => {
        const mensaje = err.error?.error || 'Error al añadir el idioma';
        return of({ success: false, mensaje });
      })
    );
  }

  actualizarNivelIdioma(idIdioma: number, nivel: string): Observable<{ success: boolean; mensaje: string }> {
    const userId = this.userId;
    if (!userId) return of({ success: false, mensaje: 'Usuario no identificado' });

    return this.http.put<any>(
      `${environment.apiUrl}/voluntarios/${userId}/idiomas/${idIdioma}`,
      { nivel },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.perfil.update(p => p ? {
          ...p,
          idiomas: p.idiomas?.map(i => i.id_idioma === idIdioma ? { ...i, nivel } : i)
        } : null);
      }),
      map(res => ({ success: true, mensaje: res.mensaje || 'Nivel actualizado' })),
      catchError(err => {
        const mensaje = err.error?.error || 'Error al actualizar el nivel';
        return of({ success: false, mensaje });
      })
    );
  }

  eliminarIdioma(idIdioma: number): Observable<{ success: boolean; mensaje: string }> {
    const userId = this.userId;
    if (!userId) return of({ success: false, mensaje: 'Usuario no identificado' });

    return this.http.delete<any>(
      `${environment.apiUrl}/voluntarios/${userId}/idiomas/${idIdioma}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.perfil.update(p => p ? {
          ...p,
          idiomas: p.idiomas?.filter(i => i.id_idioma !== idIdioma)
        } : null);
      }),
      map(res => ({ success: true, mensaje: res.mensaje || 'Idioma eliminado' })),
      catchError(err => {
        const mensaje = err.error?.error || 'Error al eliminar el idioma';
        return of({ success: false, mensaje });
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
      id_curso_actual: response.curso_actual?.id || response.id_curso_actual || response.id_curso,
      fecha_nac: response.fecha_nac || '',
      horasTotales: 0,
      carnetConducir: response.carnet_conducir || false,
      descripcion: response.descripcion || '',
      experiencia: '',
      foto: googlePhoto || response.img_perfil || '',
      email: googleEmail || response.usuario?.correo || response.correo || '',
      preferencias: response.preferencias || [],
      idiomas: response.idiomas || []
    };
  }

  private mapearActividadDisponible(act: any): ActividadDisponible {
    // La API devuelve "tipo" como string (puede tener múltiples tipos separados por coma)
    // Convertimos a array para mantener compatibilidad
    let tiposArray: string[] = [];
    if (act.tipo && typeof act.tipo === 'string' && act.tipo.trim().length > 0) {
      // El tipo puede venir como "Tipo1, Tipo2, Tipo3" - separar por coma
      tiposArray = act.tipo.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    } else if (Array.isArray(act.tipos)) {
      tiposArray = act.tipos.map((t: any) => {
        if (typeof t === 'string') return t;
        if (t && typeof t === 'object') {
          return t.nombre || t.nombreTipo || '';
        }
        return '';
      }).filter((t: string) => t.length > 0);
    }

    // La API no devuelve ODS en /actividades, lo dejamos vacío por ahora
    // Si la API devolviera "ods", lo mapearíamos aquí
    let odsArray: { id: number; nombre: string; color?: string }[] = [];
    if (Array.isArray(act.ods)) {
      odsArray = act.ods.map((o: any) => ({
        id: Number(o.id),
        nombre: o.nombre || '',
        color: o.color || ''
      }));
    }

    const result: ActividadDisponible = {
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
      tipos: tiposArray,
      ods: odsArray,
      inscrito: false,
      estadoInscripcion: null,
      imagen: act.imagen_actividad || act.img_actividad || act.imgActividad || act.imagen || null
    };

    return result;
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
      ods: act.ods || [],
      imagen: act.imagen_actividad || act.img_actividad || act.imgActividad || act.imagen || null
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

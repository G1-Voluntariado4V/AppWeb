import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, tap, forkJoin, filter, take, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BackendUser } from '../../../shared/models/interfaces/backend-user';
import { environment } from '../../../../environments/environment';

// Interfaces actualizadas para coincidir con el backend
export interface ActividadOrg {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  duracion_horas: number;
  cupo_maximo: number;
  ubicacion?: string;
  estado: 'En revision' | 'Publicada' | 'Finalizada' | 'Rechazada';
  voluntariosInscritos: number;
  inscritosPendientes: number;
  ods?: { id: number; nombre: string }[];
  tipos?: { id: number; nombre: string }[];
}

export interface PerfilOrganizacion {
  id: number;
  nombre: string;
  rol: string;
  email: string;
  telefono: string;
  descripcion: string;
  web: string;
  foto: string | null;
  cif?: string;
  direccion?: string;
}

export interface EstadisticasOrg {
  total_actividades: number;
  actividades_publicadas: number;
  actividades_en_revision: number;
  total_voluntarios: number;
  total_inscripciones: number;
  inscripciones_confirmadas: number;
  inscripciones_pendientes: number;
}

export interface ODS {
  id: number;
  nombre: string;
  color?: string;
}

export interface TipoVoluntariado {
  id: number;
  nombre: string;
}

export interface VoluntarioInscrito {
  id_voluntario: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  dni?: string;
  bio?: string;
  fecha_nac?: string;
  fecha_solicitud: string;
  estado_solicitud: 'Pendiente' | 'Confirmada' | 'Rechazada' | 'Aceptada';
}

// Interface para respuesta del backend
interface OrganizacionPerfilResponse {
  nombre?: string | null;
  cif?: string | null;
  descripcion?: string | null;
  direccion?: string | null;
  sitio_web?: string | null;
  telefono?: string | null;
  img_perfil?: string | null;
  usuario?: {
    id_usuario?: number;
    correo?: string;
    estado_cuenta?: string;
  } | null;
  id_usuario?: number;
  correo?: string;
  estado_cuenta?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizacionService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  private googlePhoto: string | null = null;
  private googleEmail: string | null = null;
  private perfilCargadoPara: number | null = null;

  // --- 1. PERFIL ---
  public perfil = signal<PerfilOrganizacion>({
    id: 0,
    nombre: '',
    rol: 'Organización',
    email: '',
    telefono: '',
    descripcion: '',
    web: '',
    foto: null,
    cif: '',
    direccion: ''
  });

  // --- 2. ACTIVIDADES ---
  private _actividades = signal<ActividadOrg[]>([]);
  public actividades = this._actividades.asReadonly();
  public cargandoActividades = signal(false);

  // --- 3. ESTADÍSTICAS ---
  private _estadisticas = signal<EstadisticasOrg>({
    total_actividades: 0,
    actividades_publicadas: 0,
    actividades_en_revision: 0,
    total_voluntarios: 0,
    total_inscripciones: 0,
    inscripciones_confirmadas: 0,
    inscripciones_pendientes: 0
  });
  public estadisticas = this._estadisticas.asReadonly();

  // --- 4. CATÁLOGOS ---
  private _odsList = signal<ODS[]>([]);
  public odsList = this._odsList.asReadonly();

  private _tiposList = signal<TipoVoluntariado[]>([]);
  public tiposList = this._tiposList.asReadonly();

  constructor() {
    // Obtener foto y correo de Google
    this.googlePhoto = this.authService.getGooglePhoto();
    this.googleEmail = this.authService.getGoogleEmail();

    // Escuchar cambios en el backend user
    this.authService.backendUser$.subscribe((backendUser) => {
      if (backendUser?.id_usuario && backendUser.rol?.toLowerCase().includes('organiz')) {
        this.cargarPerfilDesdeBackend(backendUser);
        this.cargarActividadesDesdeBackend(backendUser.id_usuario);
        this.cargarEstadisticasDesdeBackend(backendUser.id_usuario);
        this.cargarCatalogos();
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

      this.perfil.update(actual => ({
        ...actual,
        foto: this.googlePhoto ?? actual.foto,
        email: this.googleEmail ?? actual.email
      }));
    });
  }

  // --- CARGAR PERFIL ---
  private cargarPerfilDesdeBackend(backendUser: BackendUser) {
    if (!backendUser.id_usuario) return;
    if (this.perfilCargadoPara === backendUser.id_usuario) return;

    this.perfilCargadoPara = backendUser.id_usuario;

    this.http
      .get<OrganizacionPerfilResponse>(`${this.apiUrl}/organizaciones/${backendUser.id_usuario}`)
      .subscribe({
        next: (respuesta) => {
          this.perfil.set(this.mapearPerfil(respuesta, backendUser));
        },
        error: () => {
          // Fallback: usar datos del backendUser directamente
          this.perfil.update(actual => ({
            ...actual,
            id: backendUser.id_usuario || 0,
            nombre: backendUser.nombre || actual.nombre,
            email: this.googleEmail ?? backendUser.correo ?? actual.email,
            telefono: backendUser.telefono || actual.telefono,
            foto: this.googlePhoto ?? backendUser.img_perfil ?? actual.foto,
          }));
        },
      });
  }

  private mapearPerfil(respuesta: OrganizacionPerfilResponse, backendUser: BackendUser): PerfilOrganizacion {
    return {
      id: backendUser.id_usuario || 0,
      nombre: respuesta.nombre || backendUser.nombre || '',
      rol: 'Organización',
      email: this.googleEmail ?? respuesta.usuario?.correo ?? backendUser.correo ?? '',
      telefono: respuesta.telefono || backendUser.telefono || '',
      descripcion: respuesta.descripcion || '',
      web: respuesta.sitio_web || '',
      foto: this.googlePhoto ?? respuesta.img_perfil ?? backendUser.img_perfil ?? null,
      cif: respuesta.cif || '',
      direccion: respuesta.direccion || ''
    };
  }

  // --- CARGAR ACTIVIDADES DESDE API ---
  private cargarActividadesDesdeBackend(orgId: number) {
    this.cargandoActividades.set(true);

    this.http
      .get<any[]>(`${this.apiUrl}/organizaciones/${orgId}/actividades`)
      .pipe(
        map(data => data.map(a => this.mapearActividad(a))),
        catchError(err => {
          console.error('Error cargando actividades:', err);
          return of([]);
        })
      )
      .subscribe(actividades => {
        this._actividades.set(actividades);
        this.cargandoActividades.set(false);
      });
  }

  private mapearActividad(a: any): ActividadOrg {
    return {
      id: a.id || a.id_actividad,
      titulo: a.titulo || '',
      descripcion: a.descripcion || '',
      fecha_inicio: a.fecha_inicio || a.fechaInicio || '',
      duracion_horas: a.duracion_horas || a.duracionHoras || 0,
      cupo_maximo: a.cupo_maximo || a.cupoMaximo || 0,
      ubicacion: a.ubicacion || '',
      estado: this.normalizarEstado(a.estado_publicacion || a.estadoPublicacion || a.estado),
      voluntariosInscritos: a.inscritos_confirmados || a.voluntariosInscritos || 0,
      inscritosPendientes: a.inscritos_pendientes || 0,
      ods: a.ods || [],
      tipos: a.tipos || a.tiposVoluntariado || []
    };
  }

  private normalizarEstado(estado: string): any {
    if (!estado) return 'En revision';
    const map: { [key: string]: string } = {
      'en revision': 'En revision',
      'publicada': 'Publicada',
      'finalizada': 'Finalizada',
      'rechazada': 'Rechazada'
    };
    return map[estado.toLowerCase()] || estado;
  }

  // --- CARGAR ESTADÍSTICAS ---
  private cargarEstadisticasDesdeBackend(orgId: number) {
    this.http
      .get<EstadisticasOrg>(`${this.apiUrl}/organizaciones/${orgId}/estadisticas`)
      .pipe(catchError(() => of(this._estadisticas())))
      .subscribe(stats => this._estadisticas.set(stats));
  }

  // --- CARGAR CATÁLOGOS (ODS y Tipos) ---
  private cargarCatalogos() {
    // ODS
    this.http.get<any[]>(`${this.apiUrl}/catalogos/ods`)
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        console.log('ODS recibidos:', data);
        this._odsList.set(data.map(o => ({
          id: o.id || o.id_ods,
          nombre: o.nombre,
          color: this.getOdsColor(o.id || o.id_ods)
        })));
      });

    // Tipos de Voluntariado
    this.http.get<any[]>(`${this.apiUrl}/catalogos/tipos-voluntariado`)
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        console.log('Tipos de voluntariado recibidos:', data);
        this._tiposList.set(data.map(t => ({
          id: t.id || t.id_tipo,
          nombre: t.nombreTipo || t.nombre_tipo || t.nombre || 'Sin nombre'
        })));
      });
  }

  private getOdsColor(id: number): string {
    const colors: { [key: number]: string } = {
      1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D',
      5: '#FF3A21', 6: '#26BDE2', 7: '#FCC30B', 8: '#A21942',
      9: '#FD6925', 10: '#DD1367', 11: '#FD9D24', 12: '#BF8B2E',
      13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B', 16: '#00689D', 17: '#19486A'
    };
    return colors[id] || '#6B7280';
  }

  // --- ESTADÍSTICAS CALCULADAS (compatibilidad) ---
  public stats = computed(() => {
    const acts = this._actividades();
    const apiStats = this._estadisticas();
    return {
      totalActividades: apiStats.total_actividades || acts.length,
      activas: apiStats.actividades_publicadas || acts.filter(a => a.estado === 'Publicada').length,
      pendientes: apiStats.actividades_en_revision || acts.filter(a => a.estado === 'En revision').length,
      totalVoluntarios: apiStats.total_voluntarios || acts.reduce((acc, curr) => acc + curr.voluntariosInscritos, 0)
    };
  });

  // --- ACCIONES ---

  // Crear actividad (envía a la API)
  crearActividad(datos: {
    titulo: string;
    descripcion?: string;
    fecha_inicio: string;
    duracion_horas: number;
    cupo_maximo: number;
    ubicacion: string;
    odsIds: number[];
    tiposIds: number[];
  }): Observable<any> {
    const orgId = this.perfil().id;
    if (!orgId) {
      return of({ error: 'No se encontró el ID de la organización' });
    }

    const payload = {
      titulo: datos.titulo,
      descripcion: datos.descripcion || '',
      fecha_inicio: datos.fecha_inicio,
      duracion_horas: datos.duracion_horas,
      cupo_maximo: datos.cupo_maximo,
      ubicacion: datos.ubicacion,
      id_organizacion: orgId,
      odsIds: datos.odsIds,
      tiposIds: datos.tiposIds
    };

    return this.http.post<any>(`${this.apiUrl}/organizaciones/${orgId}/actividades`, payload).pipe(
      tap(respuesta => {
        // Recargar actividades después de crear
        this.cargarActividadesDesdeBackend(orgId);
        this.cargarEstadisticasDesdeBackend(orgId);
      }),
      catchError(err => {
        console.error('Error creando actividad:', err);
        throw err;
      })
    );
  }

  // Obtener voluntarios inscritos en una actividad
  obtenerVoluntariosActividad(actividadId: number): Observable<VoluntarioInscrito[]> {
    const orgId = this.perfil().id;
    if (!orgId) return of([]);

    return this.http.get<VoluntarioInscrito[]>(
      `${this.apiUrl}/organizaciones/${orgId}/actividades/${actividadId}/voluntarios`
    );
  }

  // Gestionar estado de inscripción (Aceptar/Rechazar)
  gestionarInscripcion(actividadId: number, voluntarioId: number, estado: 'Aceptada' | 'Rechazada' | 'Pendiente'): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/actividades/${actividadId}/inscripciones/${voluntarioId}`,
      { estado }
    );
  }

  // Recargar datos manualmente
  recargarDatos() {
    const orgId = this.perfil().id;
    if (orgId) {
      this.cargarActividadesDesdeBackend(orgId);
      this.cargarEstadisticasDesdeBackend(orgId);
    }
  }

  actualizarPerfil(datos: Partial<PerfilOrganizacion>) {
    this.perfil.update(actual => ({ ...actual, ...datos }));
  }
}

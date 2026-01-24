import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map, tap, forkJoin, BehaviorSubject, delay, filter, take, switchMap } from 'rxjs';

import { BackendUser } from '../../../shared/models/interfaces/backend-user';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

// --- INTERFACES ---
export interface DashboardStats {
    voluntariosActivos: number;
    organizacionesActivas: number;
    actividadesTotales: number;
    usuariosPendientes: number;
}

export interface Aviso {
    id: number;
    titulo: string;
    subtitulo: string;
    tipo: 'alerta' | 'info' | 'success';
    ruta?: string; // Ruta para navegar al hacer click
    icono?: string; // Icono FontAwesome opcional
}

export interface PerfilCoordinadorUI {
    id_usuario?: number;
    nombre: string;
    apellidos?: string;
    cargo: string;
    email: string;
    telefono: string | null;
    foto: string | null;
    estado_cuenta?: string;
}

export interface ODS {
    id: number;
    nombre: string;
    descripcion?: string;
}

export interface TipoVoluntariado {
    id: number;
    nombreTipo: string;
}

export interface Curso {
    id: number;
    nombre: string;
    nivel?: number;
    abreviacion?: string;
    grado?: string;
}

export interface OrganizacionAdmin {
    id: number;
    nombre: string;
    cif?: string;
    email: string;
    telefono?: string;
    direccion?: string;
    sitioWeb?: string;
    descripcion?: string;
    estado: 'Activa' | 'Pendiente' | 'Bloqueada' | 'Rechazada';
    fecha_registro?: string;
    actividadesCount?: number;
}

export interface VoluntarioAdmin {
    id: number;
    nombre: string;
    apellidos?: string;
    email: string;
    dni?: string;
    telefono?: string;
    curso: string;
    fecha_nac?: string;
    estado: 'Activa' | 'Pendiente' | 'Bloqueada' | 'Rechazada';
    actividadesCount: number;
    foto?: string | null;
    descripcion?: string;
}

export interface ActividadAdmin {
    id: number;
    titulo: string;
    descripcion?: string;
    organizacion: string;
    organizacionId?: number;
    fecha_inicio: string;
    duracion_horas?: number;
    cupo_maximo?: number;
    inscritos_confirmados?: number;
    inscritos_pendientes?: number;
    ubicacion?: string;
    estado: 'Publicada' | 'En revision' | 'Cancelada' | 'Rechazada' | 'Finalizada';
    ods?: ODS[];
    tipos?: TipoVoluntariado[];
}

export interface UsuarioAdmin {
    id: number;
    correo: string;
    rol: string;
    estado_cuenta: string;
    fecha_registro?: string;
    nombre?: string;
    apellidos?: string;
    foto?: string | null;
}

export interface InscripcionPendiente {
    id_actividad: number;
    titulo_actividad: string;
    organizacion: string;
    fecha_actividad: string;
    id_voluntario: number;
    nombre_voluntario: string;
    email_voluntario: string;
    estado_solicitud: string;
    fecha_solicitud: string;
}

@Injectable({
    providedIn: 'root'
})
export class CoordinadorService {

    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private destroyRef = inject(DestroyRef);

    private apiUrl = environment.apiUrl;

    // --- ESTADO DEL PERFIL ---
    private perfilPorDefecto: PerfilCoordinadorUI = {
        nombre: 'Coordinador',
        cargo: 'Coordinador',
        email: '',
        telefono: null,
        foto: null,
    };

    public perfilUsuario = signal<PerfilCoordinadorUI>({ ...this.perfilPorDefecto });

    private backendUserCache: BackendUser | null = null;
    private perfilCargadoPara: number | null = null;
    private googlePhoto: string | null = null;
    private googleEmail: string | null = null;

    // --- CATÁLOGOS CACHEADOS ---
    private _odsList = signal<ODS[]>([]);
    private _tiposList = signal<TipoVoluntariado[]>([]);
    private _cursosList = signal<Curso[]>([]);
    public odsList = this._odsList.asReadonly();
    public tiposList = this._tiposList.asReadonly();
    public cursosList = this._cursosList.asReadonly();

    constructor() {
        this.googlePhoto = this.authService.getGooglePhoto();
        this.googleEmail = this.authService.getGoogleEmail();

        // Suscripción con cleanup automático para evitar memory leaks
        this.authService.backendUser$.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((backendUser) => {
            this.backendUserCache = backendUser;
            if (backendUser?.id_usuario) {
                this.cargarPerfilDesdeBackend(backendUser);
            } else if (!backendUser) {
                this.resetPerfil();
                this.perfilCargadoPara = null;
            }
        });

        // Suscripción con cleanup automático para evitar memory leaks
        this.authService.user$.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((firebaseUser) => {
            if (!firebaseUser) return;
            if (firebaseUser.photoURL) this.googlePhoto = firebaseUser.photoURL;
            if (firebaseUser.email) this.googleEmail = firebaseUser.email;
            this.perfilUsuario.update((actual) => ({
                ...actual,
                foto: this.googlePhoto ?? actual.foto,
                email: this.googleEmail ?? actual.email,
            }));
        });

        // Cargar catálogos al iniciar
        this.cargarCatalogos();
    }

    // --- HEADERS CON ID DE ADMIN ---
    private getAdminHeaders(): HttpHeaders {
        const adminId = this.backendUserCache?.id_usuario || this.authService.getBackendUserSnapshot()?.id_usuario;
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'X-Admin-Id': adminId?.toString() || ''
        });
    }

    // --- CATÁLOGOS ---
    cargarCatalogos(): void {
        this.http.get<any[]>(`${this.apiUrl}/ods`).pipe(
            catchError(() => of([]))
        ).subscribe(data => {
            const mapped = data.map(o => ({ id: o.id ?? o.id_ods, nombre: o.nombre, descripcion: o.descripcion }));
            this._odsList.set(mapped);
        });

        this.http.get<any[]>(`${this.apiUrl}/catalogos/tipos-voluntariado`).pipe(
            catchError(() => of([]))
        ).subscribe(data => {
            const mapped = data.map(t => ({ id: t.id ?? t.id_tipo, nombreTipo: t.nombreTipo ?? t.nombre_tipo }));
            this._tiposList.set(mapped);
        });

        const timestamp = new Date().getTime();
        this.http.get<any[]>(`${this.apiUrl}/catalogos/cursos?t=${timestamp}`).pipe(
            catchError(() => of([]))
        ).subscribe(data => {
            const mapped = data.map(c => ({
                id: c.id ?? c.id_curso,
                nombre: c.nombre,
                nivel: c.nivel,
                abreviacion: c.abreviacion,
                grado: c.grado
            }));
            this._cursosList.set(mapped);
        });
    }

    // --- DASHBOARD STATS ---
    getDashboardStats(): Observable<DashboardStats> {
        return forkJoin({
            voluntarios: this.http.get<any[]>(`${this.apiUrl}/voluntarios`).pipe(catchError(() => of([]))),
            organizaciones: this.http.get<any[]>(`${this.apiUrl}/organizaciones`).pipe(catchError(() => of([]))),
            actividades: this.http.get<any[]>(`${this.apiUrl}/actividades`).pipe(catchError(() => of([]))),
            usuarios: this.http.get<any[]>(`${this.apiUrl}/usuarios`).pipe(catchError(() => of([])))
        }).pipe(
            map(({ voluntarios, organizaciones, actividades, usuarios }) => {
                const voluntariosActivos = voluntarios.filter(v => v.estado_cuenta === 'Activa').length;
                const organizacionesActivas = organizaciones.filter(o => o.estado_cuenta === 'Activa').length;
                const actividadesTotales = actividades.length;
                const usuariosPendientes = usuarios.filter(u => u.estado_cuenta === 'Pendiente').length;

                return {
                    voluntariosActivos,
                    organizacionesActivas,
                    actividadesTotales,
                    usuariosPendientes
                };
            })
        );
    }

    getAvisos(): Observable<Aviso[]> {
        return forkJoin({
            voluntarios: this.getSolicitudesVoluntarios().pipe(catchError(() => of([]))),
            organizaciones: this.getSolicitudesOrganizaciones().pipe(catchError(() => of([]))),
            actividades: this.getSolicitudesActividades().pipe(catchError(() => of([]))),
            inscripciones: this.getInscripcionesPendientes().pipe(catchError(() => of([])))
        }).pipe(
            map(({ voluntarios, organizaciones, actividades, inscripciones }) => {
                const avisos: Aviso[] = [];
                let idCounter = 1;

                // Voluntarios pendientes
                const volPendientes = voluntarios.length;
                if (volPendientes > 0) {
                    avisos.push({
                        id: idCounter++,
                        titulo: 'Voluntarios pendientes',
                        subtitulo: `${volPendientes} ${volPendientes === 1 ? 'solicitud' : 'solicitudes'} de registro`,
                        tipo: 'alerta',
                        ruta: '/coordinador/aprobaciones/voluntarios',
                        icono: 'fa-user-clock'
                    });
                }

                // Organizaciones pendientes
                const orgPendientes = organizaciones.length;
                if (orgPendientes > 0) {
                    avisos.push({
                        id: idCounter++,
                        titulo: 'Organizaciones pendientes',
                        subtitulo: `${orgPendientes} ${orgPendientes === 1 ? 'organización' : 'organizaciones'} por aprobar`,
                        tipo: 'alerta',
                        ruta: '/coordinador/aprobaciones/organizaciones',
                        icono: 'fa-building-circle-exclamation'
                    });
                }

                // Actividades en revisión
                const actRevision = actividades.length;
                if (actRevision > 0) {
                    avisos.push({
                        id: idCounter++,
                        titulo: 'Actividades en revisión',
                        subtitulo: `${actRevision} ${actRevision === 1 ? 'actividad' : 'actividades'} por revisar`,
                        tipo: 'info',
                        ruta: '/coordinador/aprobaciones/actividades',
                        icono: 'fa-calendar-check'
                    });
                }

                // Inscripciones pendientes
                const inscripcionesPendientes = inscripciones.length;
                if (inscripcionesPendientes > 0) {
                    avisos.push({
                        id: idCounter++,
                        titulo: 'Inscripciones nuevas',
                        subtitulo: `${inscripcionesPendientes} ${inscripcionesPendientes === 1 ? 'voluntario espera' : 'voluntarios esperan'} confirmación`,
                        tipo: 'success', // Usamos success o info par diferenciar
                        ruta: '/coordinador/aprobaciones/actividades', // Redirige a actividades donde se gestionan
                        icono: 'fa-clipboard-user'
                    });
                }

                // Si no hay nada pendiente
                if (avisos.length === 0) {
                    avisos.push({
                        id: 0,
                        titulo: '¡Todo al día!',
                        subtitulo: 'No hay tareas pendientes',
                        tipo: 'success',
                        icono: 'fa-circle-check'
                    });
                }

                return avisos;
            })
        );
    }

    // --- USUARIOS (Voluntarios + Organizaciones) ---
    getUsuarios(): Observable<UsuarioAdmin[]> {
        return this.http.get<any[]>(`${this.apiUrl}/usuarios`).pipe(
            map(data => data.map(u => ({
                id: u.id_usuario,
                correo: u.correo,
                rol: u.nombre_rol || u.rol,
                estado_cuenta: u.estado_cuenta,
                fecha_registro: u.fecha_registro,
                nombre: u.nombre,
                apellidos: u.apellidos,
                foto: this.resolveImagenUrl(u.img_perfil)
            }))),
            catchError(() => of([]))
        );
    }

    // --- DETALLE VOLUNTARIO ---
    getVoluntarioDetalle(id: number): Observable<VoluntarioAdmin> {
        return this.http.get<any>(`${this.apiUrl}/voluntarios/${id}`).pipe(
            map(v => ({
                id: v.id_usuario ?? v.id,
                nombre: v.nombre,
                apellidos: v.apellidos,
                email: v.correo || v.email,
                dni: v.dni || 'N/A',
                telefono: v.telefono,
                curso: v.curso || v.curso_actual || 'Sin asignar',
                fecha_nac: v.fecha_nac,
                estado: v.estado_cuenta || 'Pendiente',
                descripcion: v.descripcion,
                actividadesCount: 0,
                foto: this.resolveImagenUrl(v.img_perfil || v.foto_perfil)
            }))
        );
    }

    /**
     * Obtiene la lista de voluntarios. 
     * Optimizado: No carga el historial (actividadesCount) por defecto para evitar N peticiones.
     */
    getVoluntarios(enrich = false): Observable<VoluntarioAdmin[]> {
        console.log(`DEBUG: getVoluntarios(enrich=${enrich})`);

        return forkJoin({
            volAjax: this.http.get<any[]>(`${this.apiUrl}/voluntarios`).pipe(catchError(() => of([]))),
            usrAjax: this.getUsuarios().pipe(catchError(() => of([])))
        }).pipe(
            switchMap(({ volAjax, usrAjax }) => {
                if (!volAjax || volAjax.length === 0) return of([]);

                if (!enrich) {
                    const list = volAjax.map(v => {
                        const userMatch = usrAjax.find(u => u.id === (v.id_usuario || v.id));
                        const rawFoto = v.img_perfil || v.foto_perfil || v.foto || v.imagen || userMatch?.foto;

                        return {
                            id: v.id_usuario ?? v.id,
                            nombre: v.nombre,
                            apellidos: v.apellidos,
                            email: v.correo_usuario || v.email || v.correo,
                            dni: v.dni || 'N/A',
                            telefono: v.telefono,
                            curso: v.curso || v.curso_actual || v.nombre_curso || 'Sin asignar',
                            fecha_nac: v.fecha_nac,
                            estado: v.estado_cuenta,
                            descripcion: '',
                            actividadesCount: 0, // No cargamos si no se pide enrich
                            foto: rawFoto && rawFoto.startsWith('http') ? rawFoto : this.resolveImagenUrl(rawFoto || null)
                        } as VoluntarioAdmin;
                    });
                    return of(list);
                }

                // Si se pide enrichment (solo para la vista principal de gestión quizás)
                const peticiones = volAjax.map(v =>
                    this.getHistorialVoluntario(v.id_usuario || v.id).pipe(
                        map(historial => {
                            const userMatch = usrAjax.find(u => u.id === (v.id_usuario || v.id));
                            const rawFoto = v.img_perfil || v.foto_perfil || v.foto || v.imagen || userMatch?.foto;
                            return {
                                id: v.id_usuario ?? v.id,
                                nombre: v.nombre,
                                apellidos: v.apellidos,
                                email: v.correo_usuario || v.email || v.correo,
                                dni: v.dni || 'N/A',
                                telefono: v.telefono,
                                curso: v.curso || v.curso_actual || v.nombre_curso || 'Sin asignar',
                                fecha_nac: v.fecha_nac,
                                estado: v.estado_cuenta,
                                actividadesCount: historial.resumen?.total_participaciones || 0,
                                foto: rawFoto && rawFoto.startsWith('http') ? rawFoto : this.resolveImagenUrl(rawFoto || null)
                            } as VoluntarioAdmin;
                        }),
                        catchError(() => of({
                            id: v.id_usuario ?? v.id,
                            nombre: v.nombre,
                            apellidos: v.apellidos,
                            email: v.correo_usuario || v.email || v.correo,
                            dni: v.dni || 'N/A',
                            telefono: v.telefono,
                            curso: v.curso || v.curso_actual || v.nombre_curso || 'Sin asignar',
                            fecha_nac: v.fecha_nac,
                            estado: v.estado_cuenta,
                            actividadesCount: 0,
                            foto: this.resolveImagenUrl(null)
                        } as VoluntarioAdmin))
                    )
                );
                return forkJoin(peticiones);
            })
        );
    }

    private resolveImagenUrl(imagen: string | null): string | null {
        if (!imagen) return null;
        if (imagen.startsWith('http')) return imagen;
        // Asumimos estructura: http://host:port/api -> http://host:port/uploads/usuarios/img
        const baseUrl = this.apiUrl.replace(/\/api\/?$/, '');
        return `${baseUrl}/uploads/usuarios/${imagen}`;
    }

    // --- ORGANIZACIONES ---
    getOrganizaciones(): Observable<OrganizacionAdmin[]> {
        return forkJoin({
            orgs: this.http.get<any[]>(`${this.apiUrl}/organizaciones`, { headers: this.getAdminHeaders() }),
            acts: this.getActividades(false).pipe(catchError(() => of([])))
        }).pipe(
            map(({ orgs, acts }) => orgs.map(o => {
                const id = o.id_usuario || o.id;
                // Calculamos el conteo en el frontend para no tocar la API ni la BD
                const count = acts.filter(a => a.organizacionId === id && a.estado === 'Publicada').length;

                return {
                    id: id,
                    nombre: o.nombre || o.nombre_organizacion || 'Sin nombre',
                    cif: o.cif || 'N/A',
                    email: o.correo || o.correo_usuario || o.email || '',
                    telefono: o.telefono,
                    direccion: o.direccion,
                    sitioWeb: o.sitio_web || o.sitioWeb,
                    descripcion: o.descripcion,
                    estado: o.estado_cuenta || o.estado || 'Pendiente',
                    fecha_registro: o.fecha_registro,
                    actividadesCount: count
                } as OrganizacionAdmin;
            })),
            catchError(err => {
                console.error('Error fetching organizations enriched:', err);
                return of([]);
            })
        );
    }

    /**
     * Obtiene la lista de actividades. 
     * Optimizado: No carga el detalle completo por defecto.
     */
    getActividades(enrich = false): Observable<ActividadAdmin[]> {
        return this.authService.backendUser$.pipe(
            filter((u): u is BackendUser => !!u && !!u.id_usuario),
            take(1),
            switchMap((u: BackendUser) => {
                const headers = new HttpHeaders({
                    'Content-Type': 'application/json',
                    'X-Admin-Id': u.id_usuario!.toString()
                });

                return this.http.get<any[]>(`${this.apiUrl}/coord/actividades`, { headers }).pipe(
                    switchMap(actividadesBase => {
                        if (!actividadesBase || actividadesBase.length === 0) return of([]);

                        if (!enrich) {
                            return of(actividadesBase.map(a => ({
                                id: a.id_actividad,
                                titulo: a.titulo || '',
                                descripcion: a.descripcion,
                                organizacion: a.nombre_organizacion || 'Sin organización',
                                organizacionId: a.id_organizacion,
                                fecha_inicio: a.fecha_inicio,
                                duracion_horas: a.duracion_horas,
                                cupo_maximo: a.cupo_maximo,
                                inscritos_confirmados: a.inscritos_confirmados || 0,
                                inscritos_pendientes: a.inscritos_pendientes || 0,
                                ubicacion: a.ubicacion,
                                estado: this.normalizarEstado(a.estado_publicacion),
                                ods: [],
                                tipos: []
                            } as ActividadAdmin)));
                        }

                        // Enrichment solo si es necesario (trae ODS/Tipos)
                        const peticiones = actividadesBase.map(a =>
                            this.getActividadDetalle(a.id_actividad).pipe(
                                catchError(() => of({
                                    id: a.id_actividad,
                                    titulo: a.titulo || '',
                                    estado: this.normalizarEstado(a.estado_publicacion),
                                    organizacion: a.nombre_organizacion || 'Sin organización',
                                    fecha_inicio: a.fecha_inicio
                                } as ActividadAdmin))
                            )
                        );
                        return forkJoin(peticiones);
                    })
                );
            })
        );
    }

    // --- ACTIVIDADES DE UNA ORGANIZACIÓN ---
    getActividadesDeOrganizacion(idOrg: number): Observable<ActividadAdmin[]> {
        return this.http.get<any[]>(`${this.apiUrl}/organizaciones/${idOrg}/actividades`).pipe(
            map(data => data.map(a => ({
                id: a.id ?? a.id_actividad,
                titulo: a.titulo || '',
                descripcion: a.descripcion,
                organizacion: a.nombre_organizacion || 'Sin organización',
                organizacionId: idOrg,
                fecha_inicio: a.fecha_inicio,
                duracion_horas: a.duracion_horas,
                cupo_maximo: a.cupo_maximo,
                inscritos_confirmados: a.inscritos_confirmados || 0,
                inscritos_pendientes: a.inscritos_pendientes || 0,
                ubicacion: a.ubicacion,
                estado: this.normalizarEstado(a.estado_publicacion || a.estado),
                ods: a.ods || [],
                tipos: a.tipos || []
            } as ActividadAdmin))),
            catchError(() => of([]))
        );
    }

    // --- DETALLE ACTIVIDAD (PÚBLICO/General) ---
    getActividadDetalle(id: number): Observable<ActividadAdmin> {
        // Usamos endpoint /actividades/{id} que devuelve el DTO completo
        return this.http.get<any>(`${this.apiUrl}/actividades/${id}`).pipe(
            map(a => ({
                id: a.id ?? a.id_actividad,
                titulo: a.titulo || '',
                descripcion: a.descripcion,
                organizacion: a.nombre_organizacion || a.organizacion?.nombre || 'Sin organización',
                organizacionId: a.id_organizacion ?? a.organizacion?.id,
                fecha_inicio: a.fecha_inicio,
                duracion_horas: a.duracion_horas,
                cupo_maximo: a.cupo_maximo,
                inscritos_confirmados: a.inscritos_confirmados || 0,
                inscritos_pendientes: a.inscritos_pendientes || 0,
                ubicacion: a.ubicacion,
                estado: this.normalizarEstado(a.estado_publicacion || a.estado),
                // El endpoint público /actividades/{id} SÍ devuelve estos arrays
                ods: a.ods || a.ODS || [],
                tipos: a.tipos || a.tipos_voluntariado || []
            }))
        );
    }

    // Helper para obtener headers como Observable (para no repetir lógica)
    private getAdminHeadersObservable(): Observable<HttpHeaders> {
        return this.authService.backendUser$.pipe(
            filter((u): u is BackendUser => !!u && !!u.id_usuario),
            take(1),
            map(u => new HttpHeaders({
                'Content-Type': 'application/json',
                'X-Admin-Id': u.id_usuario!.toString()
            }))
        );
    }

    private normalizarEstado(estado: string): any {
        if (!estado) return 'En revision';
        // Capitalizar primera letra: 'finalizada' -> 'Finalizada'
        const s = estado || '';
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }

    // --- CREAR ACTIVIDAD ---
    crearActividad(datos: any): Observable<any> {
        const payload = {
            id_organizacion: datos.id_organizacion,
            titulo: datos.titulo,
            descripcion: datos.descripcion,
            ubicacion: datos.ubicacion,
            duracion_horas: datos.duracion_horas,
            cupo_maximo: datos.cupo_maximo,
            fecha_inicio: datos.fecha_inicio,
            odsIds: datos.odsIds || [],
            tiposIds: datos.tiposIds || []
        };
        return this.http.post(`${this.apiUrl}/actividades`, payload);
    }

    // --- CAMBIAR ESTADO DE USUARIO (Aprobar/Rechazar/Bloquear) ---
    cambiarEstadoUsuario(id: number, rol: 'voluntarios' | 'organizaciones', estado: string): Observable<any> {
        return this.http.patch(
            `${this.apiUrl}/coord/${rol}/${id}/estado`,
            { estado },
            { headers: this.getAdminHeaders() }
        );
    }

    // --- CAMBIAR ESTADO DE ACTIVIDAD ---
    cambiarEstadoActividad(id: number, estado: string): Observable<any> {
        return this.http.patch(
            `${this.apiUrl}/coord/actividades/${id}/estado`,
            { estado },
            { headers: this.getAdminHeaders() }
        );
    }

    // --- ELIMINAR USUARIO ---
    eliminarUsuario(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/usuarios/${id}`);
    }

    // --- ELIMINAR ACTIVIDAD ---
    eliminarActividad(id: number): Observable<any> {
        return this.http.delete(
            `${this.apiUrl}/coord/actividades/${id}`,
            { headers: this.getAdminHeaders() }
        );
    }

    // --- EDITAR ACTIVIDAD ---
    editarActividad(id: number, datos: any): Observable<any> {
        return this.http.put(
            `${this.apiUrl}/actividades/${id}`,
            datos,
            { headers: this.getAdminHeaders() }
        );
    }

    // --- SOLICITUDES PENDIENTES ---
    // OPTIMIZADO: No pedimos enrich (true) para las listas de aprobación
    getSolicitudesVoluntarios(): Observable<VoluntarioAdmin[]> {
        return this.getVoluntarios(false).pipe(
            map(vols => vols.filter(v => v.estado === 'Pendiente'))
        );
    }

    getSolicitudesOrganizaciones(): Observable<OrganizacionAdmin[]> {
        return this.getOrganizaciones().pipe(
            map(orgs => orgs.filter(o => o.estado === 'Pendiente'))
        );
    }

    getSolicitudesActividades(): Observable<ActividadAdmin[]> {
        return this.getActividades(false).pipe(
            map(acts => acts.filter(a => a.estado === 'En revision'))
        );
    }

    // --- APROBAR/RECHAZAR ---
    aprobarVoluntario(id: number): Observable<any> {
        return this.cambiarEstadoUsuario(id, 'voluntarios', 'Activa');
    }

    rechazarVoluntario(id: number): Observable<any> {
        return this.cambiarEstadoUsuario(id, 'voluntarios', 'Rechazada');
    }

    aprobarOrganizacion(id: number): Observable<any> {
        return this.cambiarEstadoUsuario(id, 'organizaciones', 'Activa');
    }

    rechazarOrganizacion(id: number): Observable<any> {
        return this.cambiarEstadoUsuario(id, 'organizaciones', 'Rechazada');
    }

    aprobarActividad(id: number): Observable<any> {
        return this.cambiarEstadoActividad(id, 'Publicada');
    }

    rechazarActividad(id: number): Observable<any> {
        return this.cambiarEstadoActividad(id, 'Rechazada');
    }

    bloquearUsuario(id: number, rol: 'voluntarios' | 'organizaciones'): Observable<any> {
        return this.cambiarEstadoUsuario(id, rol, 'Bloqueada');
    }

    // --- EDITAR VOLUNTARIO (Como coordinador) ---
    editarVoluntario(id: number, datos: { nombre: string; apellidos: string; telefono?: string; descripcion?: string; curso?: string; fecha_nac?: string }): Observable<any> {
        return this.http.put(
            `${this.apiUrl}/voluntarios/${id}`,
            datos,
            { headers: this.getAdminHeaders() }
        );
    }

    // --- EDITAR ORGANIZACIÓN (Como coordinador) ---
    editarOrganizacion(id: number, datos: { nombre: string; descripcion?: string; telefono?: string; direccion?: string; sitioWeb?: string }): Observable<any> {
        return this.http.put(
            `${this.apiUrl}/organizaciones/${id}`,
            datos,
            { headers: this.getAdminHeaders() }
        );
    }

    // --- HISTORIAL VOLUNTARIO ---
    getHistorialVoluntario(id: number): Observable<any> {
        return this.http.get(
            `${this.apiUrl}/voluntarios/${id}/historial`,
            { headers: this.getAdminHeaders() }
        );
    }

    // --- PARTICIPANTES ACTIVIDAD ---
    getParticipantesActividad(idActividad: number): Observable<any[]> {
        return this.http.get<any[]>(
            `${this.apiUrl}/actividades/${idActividad}/participantes-detalle`,
            { headers: this.getAdminHeaders() }
        );
    }

    gestionarEstadoInscripcion(idActividad: number, idVoluntario: number, nuevoEstado: string): Observable<any> {
        return this.http.patch(
            `${this.apiUrl}/actividades/${idActividad}/inscripciones/${idVoluntario}`,
            { estado: nuevoEstado },
            { headers: this.getAdminHeaders() }
        );
    }

    eliminarInscripcion(idActividad: number, idVoluntario: number): Observable<any> {
        return this.http.delete(
            `${this.apiUrl}/actividades/${idActividad}/inscripciones/${idVoluntario}`,
            { headers: this.getAdminHeaders() }
        );
    }

    // --- INSCRIPCIONES ---

    // Obtiene todas las inscripciones pendientes de todas las actividades
    // OPTIMIZADO: Usa getActividades(false) para evitar enrichment masivo.
    getInscripcionesPendientes(): Observable<InscripcionPendiente[]> {
        return this.getActividades(false).pipe(
            switchMap(actividades => {
                // Filtramos solo actividades publicadas que tienen inscripciones pendientes
                const conPendientes = actividades.filter(a => a.estado === 'Publicada' && (a.inscritos_pendientes || 0) > 0);

                if (conPendientes.length === 0) return of([]);

                // Obtenemos inscripciones solo de las que realmente tienen algo
                const requests = conPendientes.map(act =>
                    this.http.get<any[]>(
                        `${this.apiUrl}/actividades/${act.id}/inscripciones`,
                        { headers: this.getAdminHeaders() }
                    ).pipe(
                        map(inscripciones => inscripciones
                            .filter(ins => (ins.estado || ins.estado_solicitud) === 'Pendiente')
                            .map(ins => ({
                                id_actividad: act.id,
                                titulo_actividad: act.titulo,
                                organizacion: act.organizacion,
                                fecha_actividad: act.fecha_inicio,
                                id_voluntario: ins.id_voluntario,
                                nombre_voluntario: ins.nombre_voluntario || '',
                                email_voluntario: ins.email_voluntario || '',
                                estado_solicitud: 'Pendiente',
                                fecha_solicitud: ins.fecha_solicitud
                            }))),
                        catchError(() => of([]))
                    )
                );

                return forkJoin(requests).pipe(map(results => results.flat()));
            })
        );
    }

    // Obtiene inscripciones de una actividad específica
    getInscripcionesActividad(idActividad: number): Observable<any[]> {
        return this.http.get<any[]>(
            `${this.apiUrl}/actividades/${idActividad}/inscripciones`,
            { headers: this.getAdminHeaders() }
        ).pipe(
            catchError(() => of([]))
        );
    }

    // Aprobar inscripción
    aprobarInscripcion(idActividad: number, idVoluntario: number): Observable<any> {
        return this.http.patch(
            `${this.apiUrl}/actividades/${idActividad}/inscripciones/${idVoluntario}`,
            { estado: 'Aceptada' },
            { headers: this.getAdminHeaders() }
        );
    }

    // Rechazar inscripción
    rechazarInscripcion(idActividad: number, idVoluntario: number): Observable<any> {
        return this.http.patch(
            `${this.apiUrl}/actividades/${idActividad}/inscripciones/${idVoluntario}`,
            { estado: 'Rechazada' },
            { headers: this.getAdminHeaders() }
        );
    }

    // --- PERFIL ---
    actualizarPerfilUsuario(datos: Partial<PerfilCoordinadorUI>) {
        this.perfilUsuario.update((actual) => ({
            ...actual,
            ...datos,
        }));
    }

    sincronizarPerfil() {
        const backendUser = this.backendUserCache ?? this.authService.getBackendUserSnapshot();
        if (backendUser?.id_usuario) {
            // Forzar recarga del backend para obtener datos actualizados
            this.cargarPerfilDesdeBackend(backendUser, true);
        }
    }

    actualizarPerfilEnBackend(id: number, datos: { nombre: string; apellidos: string; telefono: string }): Observable<any> {
        return this.http.put(
            `${this.apiUrl}/coordinadores/${id}`,
            datos,
            { headers: this.getAdminHeaders() }
        ).pipe(
            tap(() => {
                this.perfilUsuario.update(actual => ({
                    ...actual,
                    nombre: datos.nombre.trim(),
                    apellidos: datos.apellidos.trim(),
                    telefono: datos.telefono
                }));
            })
        );
    }

    private cargarPerfilDesdeBackend(backendUser: BackendUser, forzarRecarga = false) {
        if (!backendUser.id_usuario) return;
        // Solo saltar si ya está cargado Y no estamos forzando recarga
        if (!forzarRecarga && this.perfilCargadoPara === backendUser.id_usuario) return;

        this.perfilCargadoPara = backendUser.id_usuario;

        this.http.get<any>(`${this.apiUrl}/coordinadores/${backendUser.id_usuario}`, {
            headers: this.getAdminHeaders()
        }).subscribe({
            next: (respuesta) => {
                this.perfilUsuario.set(this.mapearPerfil(respuesta, backendUser));
            },
            error: () => {
                this.perfilUsuario.update((actual) => ({
                    ...actual,
                    email: this.googleEmail ?? backendUser.correo ?? actual.email,
                    cargo: this.resolverCargo(backendUser.rol),
                }));
            },
        });
    }

    private mapearPerfil(respuesta: any, backendUser: BackendUser): PerfilCoordinadorUI {
        const nombreBackendUser = [backendUser.nombre, backendUser.apellidos].filter(Boolean).join(' ').trim();
        const correoGoogle = this.googleEmail;
        const correoBackend = respuesta.usuario?.correo ?? respuesta.correo ?? backendUser.correo;
        const fotoGoogle = this.googlePhoto;
        const fotoBackend = respuesta.img_perfil || backendUser.img_perfil;
        const fotoBackendResolved = this.resolveImagenUrl(fotoBackend);

        // Si tenemos datos del perfil (respuesta.nombre), los usamos tal cual para evitar duplicados.
        // Si no, recurrimos al backendUser o al correo.
        return {
            id_usuario: backendUser.id_usuario,
            nombre: respuesta.nombre || backendUser.nombre || correoGoogle?.split('@')[0] || this.perfilPorDefecto.nombre,
            apellidos: respuesta.apellidos || backendUser.apellidos || '',
            cargo: this.resolverCargo((respuesta.usuario)?.rol?.nombre || respuesta.rol || backendUser.rol),
            email: correoGoogle ?? correoBackend ?? this.perfilPorDefecto.email,
            telefono: respuesta.telefono ?? backendUser.telefono ?? null,
            foto: fotoBackendResolved || fotoGoogle || null,
            estado_cuenta: backendUser.estado_cuenta
        };
    }

    private resolverCargo(valor?: string | null) {
        if (!valor) return 'Coordinador';
        const normalizado = valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (normalizado.includes('coordin')) return 'Coordinador';
        return valor;
    }

    private resetPerfil() {
        this.perfilUsuario.set({ ...this.perfilPorDefecto });
    }
}

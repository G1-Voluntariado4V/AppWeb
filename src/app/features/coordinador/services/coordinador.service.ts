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

export interface Aviso { id: number; titulo: string; subtitulo: string; tipo: 'alerta' | 'info'; }

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
        this.http.get<any[]>(`${this.apiUrl}/catalogos/ods`).pipe(
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

        this.http.get<any[]>(`${this.apiUrl}/catalogos/cursos`).pipe(
            catchError(() => of([]))
        ).subscribe(data => {
            const mapped = data.map(c => ({ id: c.id ?? c.id_curso, nombre: c.nombre }));
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
            usuarios: this.http.get<any[]>(`${this.apiUrl}/usuarios`).pipe(catchError(() => of([]))),
            actividades: this.http.get<any[]>(`${this.apiUrl}/actividades`).pipe(catchError(() => of([])))
        }).pipe(
            map(({ usuarios, actividades }) => {
                const avisos: Aviso[] = [];
                const pendientes = usuarios.filter(u => u.estado_cuenta === 'Pendiente').length;
                const actividadesRevision = actividades.filter(a => a.estado_publicacion === 'En revision').length;

                if (pendientes > 0) {
                    avisos.push({ id: 1, titulo: 'Usuarios pendientes', subtitulo: `${pendientes} solicitudes nuevas`, tipo: 'alerta' });
                }
                if (actividadesRevision > 0) {
                    avisos.push({ id: 2, titulo: 'Actividades en revisión', subtitulo: `${actividadesRevision} propuestas pendientes`, tipo: 'info' });
                }
                if (avisos.length === 0) {
                    avisos.push({ id: 0, titulo: 'Todo al día', subtitulo: 'No hay tareas pendientes', tipo: 'info' });
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
                apellidos: u.apellidos
            }))),
            catchError(() => of([]))
        );
    }

    // --- VOLUNTARIOS ---
    getVoluntarios(): Observable<VoluntarioAdmin[]> {
        return this.http.get<any[]>(`${this.apiUrl}/voluntarios`).pipe(
            map(data => data.map(v => ({
                id: v.id_usuario,
                nombre: v.nombre || '',
                apellidos: v.apellidos || '',
                email: v.correo || '',
                dni: v.dni,
                telefono: v.telefono,
                curso: v.curso_actual || v.nombre_curso || 'Sin asignar',
                fecha_nac: v.fecha_nac,
                estado: v.estado_cuenta || 'Pendiente',
                actividadesCount: v.total_inscripciones || 0,
                foto: v.foto_perfil || v.img_perfil
            }))),
            catchError(() => of([]))
        );
    }

    // --- ORGANIZACIONES ---
    getOrganizaciones(): Observable<OrganizacionAdmin[]> {
        return this.http.get<any[]>(`${this.apiUrl}/organizaciones`).pipe(
            map(data => data.map(o => ({
                id: o.id_usuario,
                nombre: o.nombre || '',
                cif: o.cif,
                email: o.correo || '',
                telefono: o.telefono,
                direccion: o.direccion,
                sitioWeb: o.sitio_web,
                descripcion: o.descripcion,
                estado: o.estado_cuenta || 'Pendiente',
                fecha_registro: o.fecha_registro,
                actividadesCount: o.total_actividades || 0
            }))),
            catchError(() => of([]))
        );
    }

    // --- ACTIVIDADES ---
    getActividades(): Observable<ActividadAdmin[]> {
        // Esperamos a tener el usuario cargado para asegurar el X-Admin-Id
        return this.authService.backendUser$.pipe(
            // Filtramos hasta que usuario y su ID existan
            filter((u): u is BackendUser => !!u && !!u.id_usuario),
            take(1), // Solo necesitamos el primero para lanzar la petición
            switchMap((u: BackendUser) => {
                const headers = new HttpHeaders({
                    'Content-Type': 'application/json',
                    'X-Admin-Id': u.id_usuario!.toString()
                });
                return this.http.get<any[]>(`${this.apiUrl}/coord/actividades`, { headers });
            }),
            map(data => data.map(a => ({
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
                ods: a.ods || [],
                tipos: a.tipos || []
            })))
        );
    }

    private normalizarEstado(estado: string): any {
        if (!estado) return 'En revision';
        // Capitalizar primera letra: 'finalizada' -> 'Finalizada'
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
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
    getSolicitudesVoluntarios(): Observable<VoluntarioAdmin[]> {
        return this.getVoluntarios().pipe(
            map(vols => vols.filter(v => v.estado === 'Pendiente'))
        );
    }

    getSolicitudesOrganizaciones(): Observable<OrganizacionAdmin[]> {
        return this.getOrganizaciones().pipe(
            map(orgs => orgs.filter(o => o.estado === 'Pendiente'))
        );
    }

    getSolicitudesActividades(): Observable<ActividadAdmin[]> {
        return this.getActividades().pipe(
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
    editarVoluntario(id: number, datos: { nombre: string; apellidos: string; telefono?: string; descripcion?: string }): Observable<any> {
        return this.http.put(
            `${this.apiUrl}/voluntarios/${id}`,
            datos,
            { headers: this.getAdminHeaders() }
        );
    }

    // --- EDITAR ORGANIZACIÓN (Como coordinador) ---
    editarOrganizacion(id: number, datos: { nombre: string; descripcion?: string; telefono?: string; direccion?: string }): Observable<any> {
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
    getInscripcionesPendientes(): Observable<InscripcionPendiente[]> {
        return this.getActividades().pipe(
            switchMap(actividades => {
                // Filtramos solo actividades publicadas
                const actividadesPublicadas = actividades.filter(a => a.estado === 'Publicada');

                if (actividadesPublicadas.length === 0) {
                    return of([]);
                }

                // Obtenemos inscripciones de cada actividad
                const requests = actividadesPublicadas.map(act =>
                    this.http.get<any[]>(
                        `${this.apiUrl}/actividades/${act.id}/inscripciones`,
                        { headers: this.getAdminHeaders() }
                    ).pipe(
                        map(inscripciones => inscripciones.map(ins => ({
                            id_actividad: act.id,
                            titulo_actividad: act.titulo,
                            organizacion: act.organizacion,
                            fecha_actividad: act.fecha_inicio,
                            id_voluntario: ins.id_voluntario,
                            nombre_voluntario: ins.nombre_voluntario || '',
                            email_voluntario: ins.email_voluntario || '',
                            estado_solicitud: ins.estado || ins.estado_solicitud,
                            fecha_solicitud: ins.fecha_solicitud
                        }))),
                        catchError(() => of([]))
                    )
                );

                return forkJoin(requests).pipe(
                    map(results => results.flat().filter(ins => ins.estado_solicitud === 'Pendiente'))
                );
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
                    nombre: `${datos.nombre} ${datos.apellidos}`.trim(),
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
        const nombreCompleto = [respuesta.nombre, respuesta.apellidos].filter(Boolean).join(' ').trim();
        const nombreBackendUser = [backendUser.nombre, backendUser.apellidos].filter(Boolean).join(' ').trim();
        const correoGoogle = this.googleEmail;
        const correoBackend = respuesta.usuario?.correo ?? respuesta.correo ?? backendUser.correo;
        const fotoGoogle = this.googlePhoto;
        const fotoBackend = respuesta.img_perfil || backendUser.img_perfil;

        return {
            id_usuario: backendUser.id_usuario,
            nombre: nombreCompleto || nombreBackendUser || correoGoogle?.split('@')[0] || this.perfilPorDefecto.nombre,
            apellidos: respuesta.apellidos,
            cargo: this.resolverCargo((respuesta.usuario)?.rol?.nombre || respuesta.rol || backendUser.rol),
            email: correoGoogle ?? correoBackend ?? this.perfilPorDefecto.email,
            telefono: respuesta.telefono ?? backendUser.telefono ?? null,
            foto: fotoGoogle ?? fotoBackend ?? null,
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

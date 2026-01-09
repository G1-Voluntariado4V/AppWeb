import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable, delay } from 'rxjs';

import { BackendUser } from '../../../shared/models/interfaces/backend-user';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

// --- INTERFACES ---
export interface DashboardStats {
  voluntariosActivos: number;
  organizacionesActivas: number; 
  horasTotales: number;
  actividadesTotales: number; 
}

export interface ActividadSemanal { dia: string; valor: number; }
export interface Aviso { id: number; titulo: string; subtitulo: string; tipo: 'alerta' | 'info'; }

export interface PerfilCoordinadorUI {
  nombre: string;
  cargo: string;
  email: string;
  telefono: string | null;
  foto: string | null;  // Foto de Google o del backend
}

interface CoordinadorPerfilResponse {
  nombre?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  img_perfil?: string | null;
  usuario?: {
    id_usuario?: number;
    correo?: string;
    estado_cuenta?: string;
    rol?: { nombre?: string } | string | null;
  } | null;
  correo?: string | null;
  rol?: string | null;
}

export interface OrganizacionAdmin {
  id: number; nombre: string; tipo: string; contacto: string; email: string; actividadesCount: number; estado: 'Active' | 'Pending' | 'Inactive'; logo?: string; 
  cif?: string; direccion?: string; sitioWeb?: string; descripcion?: string; telefono?: string;
}

export interface VoluntarioAdmin {
  id: number; nombre: string; email: string; curso: string; actividadesCount: number; estado: 'Activo' | 'Inactivo' | 'Pendiente'; foto?: string;
}

export interface ActividadAdmin {
  id: number; nombre: string; tipo: string; organizador: string; fecha: string; estado: 'Active' | 'Pending' | 'In Progress' | 'Finished'; 
  descripcion?: string; duracionHoras?: number; cupoMaximo?: number; ubicacion?: string;
}

export interface SolicitudOrganizacion { id: number; organizacion: string; email: string; fechaRegistro: string; tipo: string; estado: 'Pendiente'; }
export interface SolicitudVoluntario { id: number; nombre: string; email: string; curso: string; actividadInteres: string; estado: 'Pendiente'; }
export interface SolicitudActividad { id: number; actividad: string; organizacion: string; estado: 'En progreso' | 'En pausa' | 'Pendiente'; fechaPropuesta: string; }

@Injectable({
  providedIn: 'root'
})
export class CoordinadorService {

  // --- 1. ESTADO GLOBAL REACTIVO (SIGNALS) ---
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

  constructor(private http: HttpClient, private authService: AuthService) {
    // Obtener foto y correo de Google al iniciar
    this.googlePhoto = this.authService.getGooglePhoto();
    this.googleEmail = this.authService.getGoogleEmail();

    this.authService.backendUser$.subscribe((backendUser) => {
      this.backendUserCache = backendUser;

      if (backendUser?.id_usuario) {
        this.cargarPerfilDesdeBackend(backendUser);
        return;
      }

      if (!backendUser) {
        this.resetPerfil();
        this.perfilCargadoPara = null;
      }
    });

    // Escuchar cambios en Firebase user para actualizar foto y correo de Google
    this.authService.user$.subscribe((firebaseUser) => {
      if (!firebaseUser) return;

      // Actualizar foto de Google
      if (firebaseUser.photoURL) {
        this.googlePhoto = firebaseUser.photoURL;
      }

      // Actualizar correo de Google
      if (firebaseUser.email) {
        this.googleEmail = firebaseUser.email;
      }

      // Actualizar foto y correo de Google
      this.perfilUsuario.update((actual) => ({
        ...actual,
        foto: this.googlePhoto ?? actual.foto,
        email: this.googleEmail ?? actual.email,
      }));
    });
  }

  actualizarPerfilUsuario(datos: Partial<PerfilCoordinadorUI>) {
    this.perfilUsuario.update((actual) => ({
      ...actual,
      ...datos,
    }));
  }

  sincronizarPerfil() {
    const backendUser = this.backendUserCache ?? this.authService.getBackendUserSnapshot();
    if (backendUser?.id_usuario) {
      this.cargarPerfilDesdeBackend(backendUser);
    }
  }

  // --- RESTO DE DATOS "VIVOS" DE TU APLICACIÓN ---

  private _organizaciones = signal<OrganizacionAdmin[]>([
    { id: 1, nombre: 'Amavir Oblatas', tipo: 'Residencia', contacto: 'Elena Martín', email: 'elena@amavir.es', actividadesCount: 12, estado: 'Active', cif: 'G-31000001', direccion: 'Av. Guipúzcoa, 5', sitioWeb: 'www.amavir.es', telefono: '948123456', descripcion: 'Residencia de ancianos.' },
    { id: 2, nombre: 'Cruz Roja', tipo: 'ONG', contacto: 'Javier Sola', email: 'javier@cruzroja.es', actividadesCount: 5, estado: 'Active', cif: 'G-28000002', direccion: 'C/ Leyre, 6', sitioWeb: 'www.cruzroja.es', telefono: '948654321', descripcion: 'Organización humanitaria.' }
  ]);

  private _voluntarios = signal<VoluntarioAdmin[]>([
    { id: 1, nombre: 'Lucía Fernández', email: 'lucia@fp.org', curso: '2º DAM', actividadesCount: 12, estado: 'Activo' },
    { id: 2, nombre: 'Marcos Alonso', email: 'marcos@fp.org', curso: '1º SMR', actividadesCount: 5, estado: 'Activo' }
  ]);

  private _actividades = signal<ActividadAdmin[]>([
    { id: 1, nombre: 'Acompañamiento', tipo: 'Social', organizador: 'Amavir', fecha: '2025-06-01', estado: 'Active', descripcion: 'Acompañamiento.', duracionHoras: 2, cupoMaximo: 5, ubicacion: 'Pamplona' },
    { id: 2, nombre: 'Limpieza Río', tipo: 'Medioambiente', organizador: 'Ayto', fecha: '2025-06-01', estado: 'In Progress', descripcion: 'Limpieza.', duracionHoras: 4, cupoMaximo: 20, ubicacion: 'Río Arga' }
  ]);

  // Solicitudes (Aprobaciones)
  private _solicitudesOrg = signal<SolicitudOrganizacion[]>([
    { id: 1, organizacion: 'Banco Alimentos', email: 'banco@alimentos.org', fechaRegistro: '20 Nov 2025', tipo: 'ONG', estado: 'Pendiente' },
    { id: 2, organizacion: 'Nuevo Proyecto', email: 'info@proyecto.org', fechaRegistro: '19 Nov 2025', tipo: 'Asociación', estado: 'Pendiente' }
  ]);
  
  private _solicitudesVol = signal<SolicitudVoluntario[]>([
    { id: 1, nombre: 'Lucía Fernández', email: 'lucia@cuatrovientos.org', curso: '2º DAM', actividadInteres: 'Taller de Smartphone', estado: 'Pendiente' },
    { id: 2, nombre: 'Marcos Alonso', email: 'marcos@cuatrovientos.org', curso: '1º SMR', actividadInteres: 'Paseo Saludable', estado: 'Pendiente' }
  ]);

  private _solicitudesAct = signal<SolicitudActividad[]>([
    { id: 1, actividad: 'Taller de Smartphone', organizacion: 'Solera Asistencial', estado: 'En progreso', fechaPropuesta: '15 Jul 2025' },
    { id: 2, actividad: 'Paseo Saludable', organizacion: 'Cruz Roja', estado: 'En pausa', fechaPropuesta: '20 Jul 2025' }
  ]);


  // --- 2. CÁLCULOS AUTOMÁTICOS (COMPUTED) ---
  // El Dashboard leerá esto y se actualizará solo.

  public statsCalculated = computed<DashboardStats>(() => {
    const vols = this._voluntarios();
    const acts = this._actividades();
    const orgs = this._organizaciones();

    // Sumamos las horas de todas las actividades activas
    const horas = acts.reduce((acc, curr) => acc + (curr.duracionHoras || 0), 0);

    return {
      voluntariosActivos: vols.filter(v => v.estado === 'Activo').length,
      organizacionesActivas: orgs.filter(o => o.estado === 'Active').length,
      horasTotales: horas * 10, // Estimación simple
      actividadesTotales: acts.length
    };
  });

  public avisosCalculated = computed<Aviso[]>(() => {
    const pendientesOrg = this._solicitudesOrg().length;
    const pendientesAct = this._solicitudesAct().length;
    const avisos: Aviso[] = [];

    if (pendientesOrg > 0) {
      avisos.push({ id: 1, titulo: 'Aprobar Organizaciones', subtitulo: `${pendientesOrg} solicitudes nuevas`, tipo: 'alerta' });
    }
    if (pendientesAct > 0) {
      avisos.push({ id: 2, titulo: 'Revisar Actividades', subtitulo: `${pendientesAct} propuestas recibidas`, tipo: 'info' });
    }
    if (avisos.length === 0) {
      avisos.push({ id: 0, titulo: 'Todo al día', subtitulo: 'No hay tareas pendientes', tipo: 'info' });
    }
    return avisos;
  });


  // --- 3. MÉTODOS DE LECTURA (Getters) ---

  getDashboardStats() { return of(this.statsCalculated()).pipe(delay(200)); } 
  getAvisos() { return of(this.avisosCalculated()).pipe(delay(200)); }
  
  getOrganizaciones() { return of(this._organizaciones()); }
  getVoluntarios() { return of(this._voluntarios()); }
  getActividadesAdmin() { return of(this._actividades()); }
  
  getSolicitudesOrganizaciones() { return of(this._solicitudesOrg()); }
  getSolicitudesVoluntarios() { return of(this._solicitudesVol()); }
  getSolicitudesActividades() { return of(this._solicitudesAct()); }
  
  getActividadSemanal() { 
    return of([{ dia: 'L', valor: 40 }, { dia: 'M', valor: 60 }, { dia: 'X', valor: 85 }, { dia: 'J', valor: 55 }, { dia: 'V', valor: 70 }]); 
  }

  // --- 4. ACCIONES (Añadir y Aprobar) ---

  // Añadir nuevos registros (Desde los Modales)
  addOrganizacion(org: OrganizacionAdmin) {
    this._organizaciones.update(lista => [org, ...lista]);
  }

  addActividad(act: ActividadAdmin) {
    this._actividades.update(lista => [act, ...lista]);
  }

  // Lógica de Aprobación REAL (Mueve de Pendiente a Activo)

  aprobarOrganizacion(id: number): Observable<boolean> {
    const solicitud = this._solicitudesOrg().find(s => s.id === id);
    if (solicitud) {
      // Creamos la org real basada en la solicitud
      const nuevaOrg: OrganizacionAdmin = {
        id: Date.now(),
        nombre: solicitud.organizacion,
        tipo: solicitud.tipo,
        contacto: 'Pendiente de asignar',
        email: solicitud.email,
        actividadesCount: 0,
        estado: 'Active',
        cif: 'PTE-' + Date.now(), // CIF temporal
        telefono: 'Pendiente'
      };
      // La añadimos a la lista oficial y la borramos de pendientes
      this._organizaciones.update(l => [nuevaOrg, ...l]);
      this._solicitudesOrg.update(l => l.filter(s => s.id !== id));
    }
    return of(true);
  }

  rechazarOrganizacion(id: number): Observable<boolean> {
    this._solicitudesOrg.update(l => l.filter(s => s.id !== id));
    return of(true);
  }

  aprobarVoluntario(id: number): Observable<boolean> {
    const solicitud = this._solicitudesVol().find(s => s.id === id);
    if(solicitud) {
        const nuevoVol: VoluntarioAdmin = {
            id: Date.now(),
            nombre: solicitud.nombre,
            email: solicitud.email,
            curso: solicitud.curso,
            actividadesCount: 0,
            estado: 'Activo'
        };
        this._voluntarios.update(l => [nuevoVol, ...l]);
        this._solicitudesVol.update(l => l.filter(s => s.id !== id));
    }
    return of(true);
  }

  rechazarVoluntario(id: number): Observable<boolean> {
    this._solicitudesVol.update(l => l.filter(s => s.id !== id));
    return of(true);
  }

  aprobarActividad(id: number): Observable<boolean> {
    const solicitud = this._solicitudesAct().find(s => s.id === id);
    if(solicitud) {
        const nuevaAct: ActividadAdmin = {
            id: Date.now(),
            nombre: solicitud.actividad,
            organizador: solicitud.organizacion,
            tipo: 'Social', // Por defecto
            fecha: new Date().toISOString().split('T')[0], // Fecha hoy por defecto
            estado: 'Active',
            duracionHoras: 2 // Por defecto
        };
        this._actividades.update(l => [nuevaAct, ...l]);
        this._solicitudesAct.update(l => l.filter(s => s.id !== id));
    }
    return of(true);
  }

  rechazarActividad(id: number): Observable<boolean> {
    this._solicitudesAct.update(l => l.filter(s => s.id !== id));
    return of(true);
  }

  private cargarPerfilDesdeBackend(backendUser: BackendUser) {
    if (!backendUser.id_usuario) return;
    if (this.perfilCargadoPara === backendUser.id_usuario) return;

    this.perfilCargadoPara = backendUser.id_usuario;

    this.http
      .get<CoordinadorPerfilResponse>(`${environment.apiUrl}/coordinadores/${backendUser.id_usuario}`)
      .subscribe({
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

  private mapearPerfil(respuesta: CoordinadorPerfilResponse, backendUser: BackendUser): PerfilCoordinadorUI {
    // PRIORIDAD NOMBRE: Backend > BackendUser nombre+apellidos > correo
    const nombreCompleto = [respuesta.nombre, respuesta.apellidos].filter(Boolean).join(' ').trim();
    const nombreBackendUser = [backendUser.nombre, backendUser.apellidos].filter(Boolean).join(' ').trim();

    // PRIORIDAD CORREO: Google > Backend
    const correoGoogle = this.googleEmail;
    const correoBackend = respuesta.usuario?.correo ?? respuesta.correo ?? backendUser.correo;

    // PRIORIDAD FOTO: Google > Backend img_perfil
    const fotoGoogle = this.googlePhoto;
    const fotoBackend = respuesta.img_perfil || backendUser.img_perfil;

    return {
      nombre: nombreCompleto || nombreBackendUser || correoGoogle?.split('@')[0] || this.perfilPorDefecto.nombre,
      cargo: this.resolverCargo((respuesta.usuario as any)?.rol?.nombre || (respuesta.rol as string) || backendUser.rol),
      email: correoGoogle ?? correoBackend ?? this.perfilPorDefecto.email,  // Google tiene prioridad
      telefono: respuesta.telefono ?? backendUser.telefono ?? null,
      foto: fotoGoogle ?? fotoBackend ?? null,  // Google tiene prioridad
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
import { Injectable } from '@angular/core';
import { of, Observable, delay } from 'rxjs';

// --- INTERFACES DASHBOARD ---
export interface DashboardStats {
  voluntariosActivos: number;
  incrementoMensual: number;
  horasTotales: number;
  voluntariadosCompletados: number;
}

export interface ActividadSemanal {
  dia: string;
  valor: number;
}

export interface Aviso {
  id: number;
  titulo: string;
  subtitulo: string;
  tipo: 'alerta' | 'info';
}

// --- INTERFAZ ORGANIZACIONES (Actualizada con SQL) ---
export interface OrganizacionAdmin {
  id: number;
  nombre: string;
  tipo: string;
  contacto: string;
  email: string;
  actividadesCount: number;
  estado: 'Active' | 'Pending' | 'Inactive';
  logo?: string;
  // Nuevos campos
  cif?: string;
  direccion?: string;
  sitioWeb?: string;
  descripcion?: string;
  telefono?: string;
}

// --- INTERFAZ VOLUNTARIOS ---
export interface VoluntarioAdmin {
  id: number;
  nombre: string;
  email: string;
  curso: string;
  actividadesCount: number;
  estado: 'Activo' | 'Inactivo' | 'Pendiente';
  foto?: string;
}

// --- INTERFAZ ACTIVIDADES (Actualizada con SQL) ---
export interface ActividadAdmin {
  id: number;
  nombre: string;
  tipo: string;
  organizador: string;
  fecha: string;
  estado: 'Active' | 'Pending' | 'In Progress' | 'Finished';
  // Nuevos campos
  descripcion?: string;
  duracionHoras?: number;
  cupoMaximo?: number;
  ubicacion?: string;
}

// --- INTERFAZ SOLICITUDES ORGANIZACIONES ---
export interface SolicitudOrganizacion {
  id: number;
  organizacion: string;
  email: string;
  fechaRegistro: string;
  tipo: string;
  estado: 'Pendiente';
}

// --- INTERFAZ SOLICITUDES VOLUNTARIOS ---
export interface SolicitudVoluntario {
  id: number;
  nombre: string;
  email: string;
  curso: string;
  actividadInteres: string;
  estado: 'Pendiente';
}

// --- INTERFAZ SOLICITUDES ACTIVIDADES ---
export interface SolicitudActividad {
  id: number;
  actividad: string;
  organizacion: string;
  estado: 'En progreso' | 'En pausa' | 'Pendiente';
  fechaPropuesta: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoordinadorService {

  // --- MOCK DATA: DASHBOARD ---
  private stats: DashboardStats = {
    voluntariosActivos: 24,
    incrementoMensual: 12,
    horasTotales: 731,
    voluntariadosCompletados: 4
  };

  private actividadSemanal: ActividadSemanal[] = [
    { dia: 'L', valor: 40 },
    { dia: 'M', valor: 60 },
    { dia: 'X', valor: 85 },
    { dia: 'J', valor: 55 },
    { dia: 'V', valor: 70 }
  ];

  private avisos: Aviso[] = [
    { id: 1, titulo: 'Revisión pendiente', subtitulo: '5 actividades nuevas', tipo: 'alerta' },
    { id: 2, titulo: 'Actualización', subtitulo: 'Nuevas funcionalidades', tipo: 'info' }
  ];

  // --- MOCK DATA: ORGANIZACIONES (Actualizada con datos completos) ---
  private organizaciones: OrganizacionAdmin[] = [
    { 
      id: 1, 
      nombre: 'Amavir Oblatas', 
      tipo: 'Residencia', 
      contacto: 'Elena Martín', 
      email: 'elena@amavir.es', 
      actividadesCount: 12, 
      estado: 'Active',
      cif: 'G-31000001',
      direccion: 'Av. Guipúzcoa, 5, Pamplona',
      sitioWeb: 'www.amavir.es',
      telefono: '948123456',
      descripcion: 'Residencia de ancianos especializada en atención integral.'
    },
    { 
      id: 2, 
      nombre: 'Cruz Roja', 
      tipo: 'ONG', 
      contacto: 'Javier Sola', 
      email: 'javier@cruzroja.es', 
      actividadesCount: 5, 
      estado: 'Active',
      cif: 'G-28000002',
      direccion: 'C/ Leyre, 6, Pamplona',
      sitioWeb: 'www.cruzroja.es',
      telefono: '948654321',
      descripcion: 'Organización humanitaria de carácter voluntario.'
    },
    { 
      id: 3, 
      nombre: 'Banco Alimentos', 
      tipo: 'ONG', 
      contacto: 'Maria Ruiz', 
      email: 'maria@banco.es', 
      actividadesCount: 0, 
      estado: 'Pending',
      cif: 'G-31555555',
      direccion: 'Polígono Landaben, Calle A',
      sitioWeb: 'www.bancoalimentosnavarra.org',
      telefono: '948999888',
      descripcion: 'Recogida y distribución de alimentos a personas necesitadas.'
    }
  ];

  // --- MOCK DATA: VOLUNTARIOS ---
  private voluntarios: VoluntarioAdmin[] = [
    { id: 1, nombre: 'Lucía Fernández', email: 'lucia.fernandez@cuatrovientos.org', curso: '2º DAM', actividadesCount: 12, estado: 'Activo' },
    { id: 2, nombre: 'Marcos Alonso', email: 'marcos.alonso@cuatrovientos.org', curso: '1º SMR', actividadesCount: 5, estado: 'Activo' },
    { id: 3, nombre: 'Sara Jiménez', email: 'sara.jimenez@cuatrovientos.org', curso: '2º GA', actividadesCount: 0, estado: 'Inactivo' }
  ];

  // --- MOCK DATA: ACTIVIDADES (Actualizada con datos completos) ---
  private actividades: ActividadAdmin[] = [
    { 
      id: 1, 
      nombre: 'Acompañamiento Amavir', 
      tipo: 'Social', 
      organizador: 'Amavir', 
      fecha: '2025-06-01', 
      estado: 'Active',
      descripcion: 'Acompañamiento a personas mayores en paseos y actividades lúdicas.',
      duracionHoras: 2,
      cupoMaximo: 5,
      ubicacion: 'Residencia Amavir Oblatas'
    },
    { 
      id: 2, 
      nombre: 'Taller de Smartphone', 
      tipo: 'Social', 
      organizador: 'Cruz Roja', 
      fecha: '2025-06-01', 
      estado: 'Pending',
      descripcion: 'Enseñar uso básico del móvil a personas mayores.',
      duracionHoras: 3,
      cupoMaximo: 10,
      ubicacion: 'Sede Cruz Roja'
    },
    { 
      id: 3, 
      nombre: 'Limpieza Río', 
      tipo: 'Medioambiente', 
      organizador: 'Ayuntamiento', 
      fecha: '2025-06-01', 
      estado: 'In Progress',
      descripcion: 'Jornada de limpieza en las orillas del río Arga.',
      duracionHoras: 4,
      cupoMaximo: 20,
      ubicacion: 'Paseo del Arga, Pamplona'
    }
  ];

  // --- MOCK DATA: SOLICITUDES ---
  private solicitudesOrganizaciones: SolicitudOrganizacion[] = [
    { id: 1, organizacion: 'Banco Alimentos', email: 'banco@alimentos.org', fechaRegistro: '20 Nov 2025', tipo: 'ONG', estado: 'Pendiente' },
    { id: 2, organizacion: 'Nuevo Proyecto', email: 'info@proyecto.org', fechaRegistro: '19 Nov 2025', tipo: 'Asociación', estado: 'Pendiente' }
  ];

  private solicitudesVoluntarios: SolicitudVoluntario[] = [
    { id: 1, nombre: 'Lucía Fernández', email: 'lucia@cuatrovientos.org', curso: '2º DAM', actividadInteres: 'Taller de Smartphone', estado: 'Pendiente' },
    { id: 2, nombre: 'Marcos Alonso', email: 'marcos@cuatrovientos.org', curso: '1º SMR', actividadInteres: 'Paseo Saludable', estado: 'Pendiente' }
  ];

  private solicitudesActividades: SolicitudActividad[] = [
    { id: 1, actividad: 'Taller de Smartphone', organizacion: 'Solera Asistencial', estado: 'En progreso', fechaPropuesta: '15 Jul 2025' },
    { id: 2, actividad: 'Paseo Saludable', organizacion: 'Cruz Roja', estado: 'En pausa', fechaPropuesta: '20 Jul 2025' }
  ];

  constructor() { }

  // --- MÉTODOS DE LECTURA ---

  getDashboardStats(): Observable<DashboardStats> { return of(this.stats).pipe(delay(300)); }
  getActividadSemanal(): Observable<ActividadSemanal[]> { return of(this.actividadSemanal).pipe(delay(300)); }
  getAvisos(): Observable<Aviso[]> { return of(this.avisos).pipe(delay(300)); }
  getOrganizaciones(): Observable<OrganizacionAdmin[]> { return of(this.organizaciones).pipe(delay(300)); }
  getVoluntarios(): Observable<VoluntarioAdmin[]> { return of(this.voluntarios).pipe(delay(300)); }
  getActividadesAdmin(): Observable<ActividadAdmin[]> { return of(this.actividades).pipe(delay(300)); }
  
  getSolicitudesOrganizaciones(): Observable<SolicitudOrganizacion[]> { return of(this.solicitudesOrganizaciones).pipe(delay(300)); }
  getSolicitudesVoluntarios(): Observable<SolicitudVoluntario[]> { return of(this.solicitudesVoluntarios).pipe(delay(300)); }
  getSolicitudesActividades(): Observable<SolicitudActividad[]> { return of(this.solicitudesActividades).pipe(delay(300)); }

  // --- MÉTODOS DE APROBACIÓN (SIMULADOS) ---

  // 1. ORGANIZACIONES
  aprobarOrganizacion(id: number): Observable<boolean> {
    console.log(`Organización ${id} aprobada.`);
    this.solicitudesOrganizaciones = this.solicitudesOrganizaciones.filter(s => s.id !== id);
    return of(true).pipe(delay(300));
  }
  rechazarOrganizacion(id: number): Observable<boolean> {
    console.log(`Organización ${id} rechazada.`);
    this.solicitudesOrganizaciones = this.solicitudesOrganizaciones.filter(s => s.id !== id);
    return of(true).pipe(delay(300));
  }

  // 2. VOLUNTARIOS
  aprobarVoluntario(id: number): Observable<boolean> {
    console.log(`Voluntario ${id} aprobado.`);
    this.solicitudesVoluntarios = this.solicitudesVoluntarios.filter(s => s.id !== id);
    return of(true).pipe(delay(300));
  }
  rechazarVoluntario(id: number): Observable<boolean> {
    console.log(`Voluntario ${id} rechazado.`);
    this.solicitudesVoluntarios = this.solicitudesVoluntarios.filter(s => s.id !== id);
    return of(true).pipe(delay(300));
  }

  // 3. ACTIVIDADES
  aprobarActividad(id: number): Observable<boolean> {
    console.log(`Actividad ${id} aprobada.`);
    this.solicitudesActividades = this.solicitudesActividades.filter(s => s.id !== id);
    return of(true).pipe(delay(300));
  }
  rechazarActividad(id: number): Observable<boolean> {
    console.log(`Actividad ${id} rechazada.`);
    this.solicitudesActividades = this.solicitudesActividades.filter(s => s.id !== id);
    return of(true).pipe(delay(300));
  }
}
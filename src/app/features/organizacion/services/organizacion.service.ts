import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable, delay } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BackendUser } from '../../../shared/models/interfaces/backend-user';
import { environment } from '../../../../environments/environment';

export interface ActividadOrg {
  id: number;
  nombre: string;
  tipo: string;
  fecha: string;
  estado: 'Activa' | 'Pendiente' | 'En Curso' | 'Finalizada';
  voluntariosInscritos: number;
  cupoMaximo: number;
  descripcion?: string;
  ubicacion?: string;
  duracionHoras?: number;
}

export interface PerfilOrganizacion {
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
}

@Injectable({
  providedIn: 'root'
})
export class OrganizacionService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private googlePhoto: string | null = null;
  private googleEmail: string | null = null;
  private perfilCargadoPara: number | null = null;

  // --- 1. PERFIL ---
  public perfil = signal<PerfilOrganizacion>({
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

  // --- 2. ACTIVIDADES (Privada para escritura, Pública para lectura) ---
  private _actividades = signal<ActividadOrg[]>([
    {
      id: 1,
      nombre: 'Acompañamiento Amavir',
      tipo: 'Social',
      fecha: '2025-06-01',
      estado: 'Activa',
      voluntariosInscritos: 12,
      cupoMaximo: 20,
      descripcion: 'Acompañamiento a mayores en paseos y actividades lúdicas.',
      ubicacion: 'Pamplona',
      duracionHoras: 2
    },
    {
      id: 2,
      nombre: 'Taller de Lectura',
      tipo: 'Cultural',
      fecha: '2025-06-15',
      estado: 'Pendiente',
      voluntariosInscritos: 0,
      cupoMaximo: 5,
      descripcion: 'Lectura de clásicos en grupo.',
      ubicacion: 'Biblioteca Residencia',
      duracionHoras: 1
    }
  ]);

  // CAMBIO CLAVE: Exponemos la señal pública de solo lectura
  public actividades = this._actividades.asReadonly();

  constructor() {
    // Obtener foto y correo de Google
    this.googlePhoto = this.authService.getGooglePhoto();
    this.googleEmail = this.authService.getGoogleEmail();

    // Escuchar cambios en el backend user
    this.authService.backendUser$.subscribe((backendUser) => {
      if (backendUser?.id_usuario && backendUser.rol?.toLowerCase().includes('organiz')) {
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

      this.perfil.update(actual => ({
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
      .get<OrganizacionPerfilResponse>(`${environment.apiUrl}/organizaciones/${backendUser.id_usuario}`)
      .subscribe({
        next: (respuesta) => {
          this.perfil.set(this.mapearPerfil(respuesta, backendUser));
        },
        error: () => {
          // Fallback: usar datos del backendUser directamente
          this.perfil.update(actual => ({
            ...actual,
            nombre: backendUser.nombre || actual.nombre,
            email: this.googleEmail ?? backendUser.correo ?? actual.email,
            telefono: backendUser.telefono || actual.telefono,
            foto: this.googlePhoto ?? backendUser.img_perfil ?? actual.foto,
            descripcion: backendUser.descripcion || actual.descripcion,
            web: backendUser.sitio_web || actual.web,
          }));
        },
      });
  }

  private mapearPerfil(respuesta: OrganizacionPerfilResponse, backendUser: BackendUser): PerfilOrganizacion {
    return {
      nombre: respuesta.nombre || backendUser.nombre || '',
      rol: 'Organización',
      email: this.googleEmail ?? respuesta.usuario?.correo ?? backendUser.correo ?? '',  // Google tiene prioridad
      telefono: respuesta.telefono || backendUser.telefono || '',
      descripcion: respuesta.descripcion || backendUser.descripcion || '',
      web: respuesta.sitio_web || backendUser.sitio_web || '',
      foto: this.googlePhoto ?? respuesta.img_perfil ?? backendUser.img_perfil ?? null,
      cif: respuesta.cif || backendUser.cif || '',
      direccion: respuesta.direccion || backendUser.direccion || ''
    };
  }

  // --- 3. GETTERS Y CÁLCULOS ---

  // Estadísticas (se recalculan solas cuando _actividades cambia)
  public stats = computed(() => {
    const acts = this._actividades();
    return {
      totalActividades: acts.length,
      activas: acts.filter(a => a.estado === 'Activa').length,
      pendientes: acts.filter(a => a.estado === 'Pendiente').length,
      totalVoluntarios: acts.reduce((acc, curr) => acc + curr.voluntariosInscritos, 0)
    };
  });

  // --- 4. ACCIONES (Modifican la señal privada) ---

  actualizarPerfil(datos: Partial<PerfilOrganizacion>) {
    this.perfil.update(actual => ({ ...actual, ...datos }));
  }

  crearActividad(nueva: ActividadOrg) {
    this._actividades.update(lista => [nueva, ...lista]);
  }

  actualizarActividad(actividadActualizada: ActividadOrg) {
    this._actividades.update(lista =>
      lista.map(a => a.id === actividadActualizada.id ? actividadActualizada : a)
    );
  }

  eliminarActividad(id: number) {
    this._actividades.update(lista => lista.filter(a => a.id !== id));
  }
}

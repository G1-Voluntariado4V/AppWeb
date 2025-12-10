import { Injectable, signal, computed } from '@angular/core';
import { of, Observable, delay } from 'rxjs';

// Interfaz para las actividades de la organización
export interface ActividadOrg {
  id: number;
  nombre: string;
  tipo: string;
  fecha: string;
  estado: 'Activa' | 'Pendiente' | 'En Curso' | 'Finalizada';
  voluntariosInscritos: number;
  cupoMaximo: number;
  // Campos extra para el detalle
  descripcion?: string;
  ubicacion?: string;
  duracionHoras?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizacionService {

  // --- 1. PERFIL DE LA ORGANIZACIÓN (Estado Global) ---
  public perfil = signal({
    nombre: 'Amavir',
    rol: 'Organizacion', // Para que el sidebar sepa qué icono poner si usas lógica de roles
    email: 'info@amavir.es',
    telefono: '+34 948 000 000',
    descripcion: 'Residencia de ancianos y centro de día.',
    web: 'www.amavir.es',
    foto: null as string | null
  });

  // --- 2. ACTIVIDADES DE LA ORGANIZACIÓN ---
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

  // --- 3. GETTERS Y CÁLCULOS ---

  getActividades() {
    return of(this._actividades()).pipe(delay(200)); // Simulamos carga
  }

  // Estadísticas simples para el Dashboard
  public stats = computed(() => {
    const acts = this._actividades();
    return {
      totalActividades: acts.length,
      activas: acts.filter(a => a.estado === 'Activa').length,
      pendientes: acts.filter(a => a.estado === 'Pendiente').length,
      totalVoluntarios: acts.reduce((acc, curr) => acc + curr.voluntariosInscritos, 0)
    };
  });

  // --- 4. ACCIONES ---

  actualizarPerfil(datos: any) {
    this.perfil.update(actual => ({ ...actual, ...datos }));
  }

  crearActividad(nueva: ActividadOrg) {
    // Al crearla, una organización suele empezar en estado 'Pendiente' de validación por el coordinador
    // Pero para el prototipo podemos ponerla directa o como quieras.
    this._actividades.update(lista => [nueva, ...lista]);
  }
}
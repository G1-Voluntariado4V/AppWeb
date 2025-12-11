import { Injectable, signal, computed } from '@angular/core';
import { of, Observable, delay } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class OrganizacionService {

  // --- 1. PERFIL ---
  public perfil = signal({
    nombre: 'Amavir',
    rol: 'Organizacion',
    email: 'info@amavir.es',
    telefono: '+34 948 000 000',
    descripcion: 'Residencia de ancianos y centro de día.',
    web: 'www.amavir.es',
    foto: null as string | null
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

  actualizarPerfil(datos: any) {
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
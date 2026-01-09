import { Rol } from '../classes/rol';
import { Curso, Idioma, TipoVoluntariado } from './catalogo';

export type EstadoUsuario = 'Pendiente' | 'Activa' | 'Rechazada' | 'Bloqueada' | 'Inactiva';

export interface Usuario {
  id_usuario: number;
  correo: string;
  google_id: string;
  refresh_token?: string;  // Token OAuth2
  id_rol: number;
  rol?: Rol | string;      // Opcional: nombre del rol para mostrar en UI
  estado_cuenta: EstadoUsuario;
}

export interface Voluntario extends Usuario {
  dni: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  fecha_nac?: Date;
  carnet_conducir: boolean;
  img_perfil?: string;
  id_curso_actual?: number;
  curso: Curso;
  idiomas: Idioma[];
  intereses?: TipoVoluntariado[];
}

export interface Organizacion extends Usuario {
  cif?: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  sitio_web?: string;
  telefono?: string;
  img_perfil?: string;
}

export interface Coordinador extends Usuario {
  nombre: string;
  apellidos: string;
  telefono?: string;
  img_perfil?: string;
}

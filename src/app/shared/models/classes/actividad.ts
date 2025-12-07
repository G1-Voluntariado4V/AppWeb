// NOTA: Asegúrate de que las rutas de importación (@models...) sean correctas en tu proyecto
// Si te da error en '@models', usa rutas relativas como './catalogo' o '../catalogo'
import { ODS, TipoVoluntariado } from "./catalogo"; 
import { Organizacion, Voluntario } from "./usuario";

export type EstadoPublicacion = 'En revision' | 'Publicada' | 'Cancelada' | 'En progreso' | 'Finalizada';

export class ImagenActividad {
  id_imagen!: number;
  id_actividad!: number;
  url_imagen!: string;
  descripcion_pie_foto?: string;
  constructor(init?: Partial<ImagenActividad>) { Object.assign(this, init); }
}

export class Actividad {
  id_actividad!: number;
  id_organizacion!: number;
  titulo!: string;
  descripcion?: string;
  fecha_inicio?: Date;
  duracion_horas?: number;
  cupo_maximo?: number;
  ubicacion?: string;
  estado_publicacion!: EstadoPublicacion;
  organizacion?: Organizacion;
  ods?: ODS[];
  tipos?: TipoVoluntariado[];
  imagenes?: ImagenActividad[];
  updated_at?: Date;       // Auditoría
  deleted_at?: Date;       // Soft-delete
  constructor(init?: Partial<Actividad>) { Object.assign(this, init); }
}

export type EstadoSolicitud = 'Pendiente' | 'Aceptado' | 'Rechazado' | 'Cancelado';

export class Inscripcion {
  id_voluntario!: number;
  id_actividad!: number;
  fecha_solicitud!: Date;
  estado_solicitud!: EstadoSolicitud;
  updated_at?: Date;       // Auditoría
  voluntario?: Voluntario;
  actividad?: Actividad;
  constructor(init?: Partial<Inscripcion>) { Object.assign(this, init); }
}
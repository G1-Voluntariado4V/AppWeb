import { ODS, TipoVoluntariado } from './catalogo';
import { Organizacion, Voluntario } from './usuario';

export type EstadoPublicacion = 'En revision' | 'Publicada' | 'Cancelada' | 'Finalizada';

export interface ImagenActividad {
  id_imagen: number;
  id_actividad: number;
  url_imagen: string;
  descripcion_pie_foto?: string;
}

export interface Actividad {
  id_actividad: number;
  id_organizacion: number;
  titulo: string;
  descripcion?: string;
  fecha_inicio?: Date;
  duracion_horas?: number;
  cupo_maximo?: number;
  ubicacion?: string;
  estado_publicacion: EstadoPublicacion;
  organizacion?: Organizacion;
  ods?: ODS[];
  tipos?: TipoVoluntariado[];
  imagenes?: ImagenActividad[];
}

export type EstadoSolicitud = 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Cancelada' | 'Finalizada';

export interface Inscripcion {
  id_voluntario: number;
  id_actividad: number;
  fecha_solicitud: Date;
  estado_solicitud: EstadoSolicitud;
  voluntario?: Voluntario;
  actividad?: Actividad;
}

export interface Curso {
  id_curso: number;
  nombre_curso: string;
  abreviacion_curso: string;
  grado: 'Grado Superior' | 'Grado Medio' | 'Grado Básico';
  nivel: 1 | 2;
}

export interface Idioma {
  id_idioma: number;
  nombre_idioma: string;
  codigo_iso?: string;
}

export interface ODS {
  id_ods: number;
  nombre: string;
  descripcion?: string;
}

export interface TipoVoluntariado {
  id_tipo: number;
  nombre_tipo: string;
}

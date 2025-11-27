import { Curso, Idioma, Rol, TipoVoluntariado } from "@models/classes/catalogo";

export type EstadoUsuario = 'Pendiente' | 'Activa' | 'Rechazada' | 'Bloqueada' | 'Inactivo';

export class Usuario {
  id_usuario!: number;
  correo!: string;
  google_id!: string;
  refresh_token?: string;  // Token OAuth2
  id_rol?: number;
  rol!: Rol;
  fecha_registro!: Date;
  estado_cuenta!: EstadoUsuario;
  updated_at?: Date;       // Auditoría
  deleted_at?: Date;       // Soft-delete
  constructor(init?: Partial<Usuario>) { Object.assign(this, init); }
}

export class Voluntario extends Usuario {
  nombre!: string;
  telefono?: string;
  fecha_nac?: Date;
  carnet_conducir!: boolean;
  img_perfil?: string;
  id_curso_actual?: number;
  curso!: Curso;
  idiomas!: Idioma[];
  intereses?: TipoVoluntariado[];
  constructor(init?: Partial<Voluntario>) { super(init); Object.assign(this, init); }

  private buildPlaceholder(letter: string): string {
    const cleaned = (letter || '?').trim().charAt(0).toUpperCase();
    return 'https://placehold.co/30x30/00F/fff/?text=' + encodeURIComponent(cleaned);
  }

  get imagenPerfil(): string {
    return this.img_perfil && this.img_perfil.length > 0
      ? this.img_perfil
      : this.buildPlaceholder(this.nombre);
  }
}

export class Organizacion extends Usuario {
  cif?: string;
  nombre!: string;
  descripcion?: string;
  direccion?: string;
  sitio_web?: string;
  telefono?: string;
  img_perfil?: string;
  constructor(init?: Partial<Organizacion>) { super(init); Object.assign(this, init); }

  private buildPlaceholder(letter: string): string {
    const cleaned = (letter || '?').trim().charAt(0).toUpperCase();
    return 'https://placehold.co/30x30/00F/fff/?text=' + encodeURIComponent(cleaned);
  }

  get imagenPerfil(): string {
    return this.img_perfil && this.img_perfil.length > 0
      ? this.img_perfil
      : this.buildPlaceholder(this.nombre);
  }
}

export class Coordinador extends Usuario {
  nombre!: string;
  telefono?: string;
  img_perfil?: string;
  constructor(init?: Partial<Coordinador>) { super(init); Object.assign(this, init); }

  private buildPlaceholder(letter: string): string {
    const cleaned = (letter || '?').trim().charAt(0).toUpperCase();
    return 'https://placehold.co/30x30/00F/fff/?text=' + encodeURIComponent(cleaned);
  }

  get imagenPerfil(): string {
    return this.img_perfil && this.img_perfil.length > 0
      ? this.img_perfil
      : this.buildPlaceholder(this.nombre);
  }
}

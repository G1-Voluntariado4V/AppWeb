export class Rol {
  id_rol!: number;
  nombre_rol!: string;

  constructor(init?: Partial<Rol>) {
    Object.assign(this, init);
    if (this.id_rol && !this.nombre_rol) {
      this.nombre_rol = this.getNombreRolPorId();
    }
  }

  private getNombreRolPorId(): string {
    switch (this.id_rol) {
      case 1: return 'Voluntario';
      case 2: return 'Organizacion';
      case 3: return 'Coordinador';
      default: return 'Desconocido';
    }
  }
}

export class Curso {
  id_curso!: number;
  nombre_curso!: string;
  abreviacion_curso!: string;
  grado!: 'Grado Superior' | 'Grado Medio' | 'Grado Básico' | 'Especial';
  nivel!: 1 | 2;
  constructor(init?: Partial<Curso>) { Object.assign(this, init); }
}

export class Idioma {
  id_idioma!: number;
  nombre_idioma!: string;
  codigo_iso?: string;
  constructor(init?: Partial<Idioma>) { Object.assign(this, init); }
}

export class ODS {
  id_ods!: number;
  nombre!: string;
  descripcion?: string;
  constructor(init?: Partial<ODS>) { Object.assign(this, init); }
}

export class TipoVoluntariado {
  id_tipo!: number;
  nombre_tipo!: string;
  constructor(init?: Partial<TipoVoluntariado>) { Object.assign(this, init); }
}

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

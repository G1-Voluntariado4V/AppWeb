export class Disponibilidad {
  id_disponibilidad!: number;
  id_voluntario!: number;
  dia_semana?: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  hora_inicio?: string;    // Formato: "HH:mm:ss"
  hora_fin?: string;       // Formato: "HH:mm:ss"

  constructor(init?: Partial<Disponibilidad>) { Object.assign(this, init); }

  // Validar que hora_fin > hora_inicio
  isValidTimeRange(): boolean {
    if (!this.hora_inicio || !this.hora_fin) return true;
    return this.hora_fin > this.hora_inicio;
  }

  // Calcular duración en minutos
  getDuracionMinutos(): number | null {
    if (!this.hora_inicio || !this.hora_fin) return null;
    const [hI, mI] = this.hora_inicio.split(':').map(Number);
    const [hF, mF] = this.hora_fin.split(':').map(Number);
    const minutosInicio = hI * 60 + mI;
    const minutosFin = hF * 60 + mF;
    return minutosFin - minutosInicio;
  }
}

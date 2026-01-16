import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VoluntarioService } from '../../services/voluntario.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit {

  private voluntarioService = inject(VoluntarioService);
  private authService = inject(AuthService);

  cargando = computed(() => this.voluntarioService.cargando());

  // Perfil del usuario
  perfil = computed(() => {
    const p = this.voluntarioService.perfil();
    const googlePhoto = this.authService.getGooglePhoto();
    const googleEmail = this.authService.getGoogleEmail();

    return {
      nombre: p?.nombre || '',
      apellidos: p?.apellidos || '',
      foto: googlePhoto || p?.foto || '',
      email: googleEmail || p?.email || ''
    };
  });

  // Nombre completo para el saludo
  nombreCompleto = computed(() => {
    const p = this.perfil();
    const nombre = [p.nombre, p.apellidos].filter(Boolean).join(' ').trim();
    return nombre || 'Voluntario';
  });

  // Estadísticas
  estadisticas = computed(() => this.voluntarioService.estadisticas());

  // Próxima actividad
  proximaActividad = computed(() => this.voluntarioService.proximaActividad());

  // Actividades activas (para el resumen)
  actividadesActivas = computed(() => this.voluntarioService.actividadesActivas());

  // Mensaje dinámico basado en las actividades
  mensajeBienvenida = computed(() => {
    const prox = this.proximaActividad();
    if (prox) {
      return `Tu próxima actividad es: ${prox.titulo}`;
    }
    const activas = this.actividadesActivas().length;
    if (activas > 0) {
      return `Tienes ${activas} actividad${activas > 1 ? 'es' : ''} activa${activas > 1 ? 's' : ''}`;
    }
    return 'No tienes actividades próximas. ¡Explora las oportunidades disponibles!';
  });

  // Impacto (horas y progreso)
  impacto = computed(() => {
    const stats = this.estadisticas();
    const horas = stats.horasTotales;
    let progreso = 0;
    let meta = 50;

    if (horas >= 100) {
      progreso = 100;
      meta = 100;
    } else if (horas >= 50) {
      progreso = ((horas - 50) / 50) * 100;
      meta = 100;
    } else {
      progreso = (horas / 50) * 100;
      meta = 50;
    }

    const mensaje = this.getMensajeImpacto(horas);

    return {
      horasTotales: horas,
      progreso: Math.min(progreso, 100),
      mensaje,
      meta,
      nivel: stats.nivelExperiencia
    };
  });

  ngOnInit() {
    // Siempre recargar datos al entrar para tener info actualizada
    this.voluntarioService.cargarTodo();
  }

  private getMensajeImpacto(horas: number): string {
    if (horas >= 100) {
      return '¡Eres un voluntario experto! Tu dedicación es inspiradora.';
    } else if (horas >= 50) {
      return '¡Gran progreso! Ya eres un voluntario experimentado.';
    } else if (horas >= 20) {
      return 'Vas por buen camino. ¡Sigue sumando horas!';
    } else if (horas > 0) {
      return 'Has comenzado tu viaje de voluntariado. ¡Cada hora cuenta!';
    }
    return 'Aún no tienes horas registradas. ¡Inscríbete en una actividad!';
  }

  formatearFecha(fecha: string): { dia: string; mes: string } {
    if (!fecha) return { dia: '--', mes: '---' };
    try {
      const date = new Date(fecha);
      const dia = date.getDate().toString();
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const mes = meses[date.getMonth()];
      return { dia, mes };
    } catch {
      return { dia: '--', mes: '---' };
    }
  }

  getEstadoClass(estado: string): { bg: string; text: string } {
    switch (estado) {
      case 'Aceptada': return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'Pendiente': return { bg: 'bg-orange-100', text: 'text-orange-700' };
      case 'Rechazada': return { bg: 'bg-red-50', text: 'text-red-600' };
      case 'Finalizada': return { bg: 'bg-gray-100', text: 'text-gray-700' };
      case 'Cancelada': return { bg: 'bg-red-100', text: 'text-red-700' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  }
}

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

  // 1. Cargamos el Perfil y las Actividades del servicio
  actividades = signal<any[]>([]);

  ngOnInit() {
    // Obtenemos las actividades al entrar
    this.actividades.set(this.voluntarioService.getActividades());
  }

  // Computed para el perfil con foto de Google
  perfil = computed(() => {
    const datos = this.voluntarioService.perfilSignal();
    const googlePhoto = this.authService.getGooglePhoto();
    
    return {
      ...datos,
      // PRIORIDAD: Google photo > Backend photo
      foto: googlePhoto || datos.foto
    };
  });

  // 2. Lógica Inteligente para el Banner (Nombre Usuario)
  usuario = computed(() => {
    const p = this.perfil();
    // Si hay próxima actividad, personalizamos el mensaje
    const proxima = this.proximaActividad();
    let mensaje = 'No tienes actividades próximas. ¡Anímate a inscribirte!';

    if (proxima) {
      mensaje = `Tu próxima actividad es: ${proxima.titulo} (${proxima.estado}).`;
    }

    // Usar nombre de la BD
    const nombreCompleto = [p.nombre, p.apellidos].filter(Boolean).join(' ').trim();

    return {
      nombre: nombreCompleto || p.nombre || 'Voluntario',
      mensaje: mensaje
    };
  });

  // 3. Lógica Inteligente para "Próxima Actividad"
  // Busca la primera actividad que esté Aceptada o Pendiente
  proximaActividad = computed(() => {
    const lista = this.actividades();
    return lista.find(a => a.estado === 'Aceptada' || a.estado === 'Pendiente') || null;
  });

  // 4. Lógica Inteligente para "Mi Impacto"
  impacto = computed(() => {
    const p = this.perfil();
    return {
      horasTotales: p.horasTotales || 0,
      mensaje: 'Estás en el top 20% de voluntarios este mes. ¡Sigue así!',
      progreso: 70 // Esto podrías calcularlo matemáticamente si quisieras
    };
  });
}
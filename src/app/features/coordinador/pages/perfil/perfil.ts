import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinadorService } from '../../services/coordinador';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Perfil implements OnInit {
  private coordinadorService = inject(CoordinadorService);
  private authService = inject(AuthService);

  // Computed que garantiza foto de Google con prioridad
  perfil = computed(() => {
    const perfilBase = this.coordinadorService.perfilUsuario();
    const googlePhoto = this.authService.getGooglePhoto();
    
    return {
      ...perfilBase,
      // PRIORIDAD: Google photo > Backend photo
      foto: googlePhoto || perfilBase.foto
    };
  });

  inicial = computed(() => (this.perfil().nombre || 'U').charAt(0).toUpperCase());
  rol = computed(() => this.perfil().cargo || 'Coordinador');

  ngOnInit() {
    this.coordinadorService.sincronizarPerfil();
  }
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterLink, Router } from "@angular/router";
import { AuthService } from "../../../../core/services/auth.service";


@Component({
  selector: 'auth-login',
  standalone: true,
  imports: [RouterLink, JsonPipe],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  logoUrl = signal<string>('assets/LogoCuatrovientos.png');
  user = signal<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  async loginWithGoogle() {
    try {
      const firebaseUser = await this.authService.loginWithGoogle();
      this.user.set(firebaseUser);
      console.log('Firebase User:', firebaseUser);

      if (firebaseUser.email) {
        // Obtener el ID de Google (providerData[0].uid suele ser el ID de Google)
        const googleId = firebaseUser.providerData[0]?.uid || firebaseUser.uid;

        try {
          const backendUser = await this.authService.verifyUser(googleId, firebaseUser.email);
          console.log('Backend User:', backendUser);

          // Redirección basada en Rol
          const rol = backendUser.rol || 'User'; // Default

          if (rol === 'Voluntario') {
            this.router.navigate(['/voluntario']);
          } else if (rol === 'Coordinador') {
            this.router.navigate(['/coordinador']);
          } else if (rol === 'Organización' || rol === 'Organizador' || rol === 'Organizacion') {
            // Ajustar según lo que devuelva exactamente la API, en auth.routes decía 'organizacion'
            this.router.navigate(['/organizacion']);
          } else {
            this.router.navigate(['/']);
          }

        } catch (backendError: any) {
          console.error('API Verification Failed:', backendError);
          if (backendError.status === 404) {
            // Redirigir a registro si no existe
            this.router.navigate(['/auth/register']);
          } else if (backendError.status === 403) {
            const msg = backendError.error?.mensaje || '';
            if (msg.includes('revisión') || msg.includes('verificada')) {
              this.router.navigate(['/auth/status'], { queryParams: { state: 'Pendiente' } });
            } else {
              this.router.navigate(['/auth/status'], { queryParams: { state: 'Bloqueada' } });
            }
          } else {
            alert('Error de conexión con el servidor.');
          }
        }
      }

    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  logout() {
    this.authService.logout().then(() => {
      this.user.set(null);
    });
  }
}

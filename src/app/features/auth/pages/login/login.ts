import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterLink, Router } from "@angular/router";

import { AuthService } from "../../../../core/services/auth.service";
import { BackendUser } from '../../../../shared/models/interfaces/backend-user';


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
  errorMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  async loginWithGoogle() {
    try {
      this.errorMessage.set(null);
      this.loading.set(true);

      const firebaseUser = await this.authService.loginWithGoogle();
      this.user.set(firebaseUser);
      console.log('Firebase User:', firebaseUser);

      if (!firebaseUser.email) {
        this.errorMessage.set('No se pudo obtener el correo de Google. Intenta con otra cuenta.');
        return;
      }

      const googleId = firebaseUser.providerData[0]?.uid || firebaseUser.uid;

      try {
        const backendUser = await this.authService.verifyUser(googleId, firebaseUser.email);
        console.log('Backend User:', backendUser);
        this.redirectByRole(backendUser);
      } catch (backendError: any) {
        console.error('API Verification Failed:', backendError);
        this.handleBackendError(backendError);
      }

    } catch (error) {
      console.error('Login failed:', error);
      this.errorMessage.set('No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  logout() {
    this.authService.logout().then(() => {
      this.user.set(null);
    });
  }

  private redirectByRole(backendUser: BackendUser) {
    const role = normalizeRole(backendUser?.rol);

    if (role === 'voluntario') {
      this.router.navigate(['/voluntario']);
      return;
    }

    if (role === 'coordinador') {
      this.router.navigate(['/coordinador']);
      return;
    }

    if (role === 'organizacion' || role === 'organizador') {
      this.router.navigate(['/organizacion']);
      return;
    }

    this.router.navigate(['/']);
  }

  private handleBackendError(error: any) {
    if (error?.status === 404) {
      this.router.navigate(['/auth/register']);
      return;
    }

    if (error?.status === 403) {
      const msg = error.error?.mensaje || '';
      const isPending = msg.includes('revisión') || msg.includes('verificada');
      const statusState = isPending ? 'Pendiente' : 'Bloqueada';
      this.router.navigate(['/auth/status'], { queryParams: { state: statusState } });
      return;
    }

    this.errorMessage.set('Error de conexión con el servidor.');
  }
}

function normalizeRole(role?: string): string {
  return (role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

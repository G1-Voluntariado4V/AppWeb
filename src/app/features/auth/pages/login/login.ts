import { ChangeDetectionStrategy, Component, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from "@angular/router";

import { AuthService } from "../../../../core/services/auth.service";
import { BackendUser } from '../../../../shared/models/interfaces/backend-user';

@Component({
  selector: 'auth-login',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  logoUrl = signal<string>('assets/LogoCuatrovientos.png');
  user = signal<any>(null);
  errorMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  async loginWithGoogle() {
    this.errorMessage.set(null);
    this.loading.set(true);
    this.cdr.markForCheck();

    try {
      // 1. Login con Google (Firebase)
      const firebaseUser = await this.authService.loginWithGoogle();
      this.user.set(firebaseUser);

      if (!firebaseUser.email) {
        this.errorMessage.set('No se pudo obtener el correo de Google. Intenta con otra cuenta.');
        this.loading.set(false);
        this.cdr.markForCheck();
        return;
      }

      const googleId = firebaseUser.providerData[0]?.uid || firebaseUser.uid;

      try {
        // 2. Verificar usuario en el backend
        const backendUser = await this.authService.verifyUser(googleId, firebaseUser.email);

        // 3. Verificar estado de cuenta
        const estado = backendUser.estado_cuenta || backendUser.estado;

        if (estado === 'Pendiente') {
          this.router.navigate(['/auth/status'], { queryParams: { state: 'Pendiente' } });
          return;
        }

        if (estado === 'Bloqueada') {
          this.router.navigate(['/auth/status'], { queryParams: { state: 'Bloqueada' } });
          return;
        }

        if (estado === 'Rechazada') {
          this.router.navigate(['/auth/status'], { queryParams: { state: 'Rechazada' } });
          return;
        }

        // 4. Redirigir según rol
        this.redirectByRole(backendUser);

      } catch (backendError: any) {
        console.error('❌ API Verification Failed:', backendError);
        this.handleBackendError(backendError);
        this.loading.set(false);
        this.cdr.markForCheck();
      }

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        this.errorMessage.set('Inicio de sesión cancelado.');
      } else {
        this.errorMessage.set('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  private redirectByRole(backendUser: BackendUser) {
    const role = this.normalizeRole(backendUser?.rol);

    let targetRoute = '/';

    if (role.includes('voluntar')) {
      targetRoute = '/voluntario';
    } else if (role.includes('coordin')) {
      targetRoute = '/coordinador';
    } else if (role.includes('organiz')) {
      targetRoute = '/organizacion';
    }

    this.router.navigate([targetRoute]);
  }

  private handleBackendError(error: any) {
    const status = error?.status;
    const mensaje = error?.error?.mensaje || '';

    // Usuario no registrado -> Ir a registro
    if (status === 404) {
      this.router.navigate(['/auth/register']);
      return;
    }

    // Usuario bloqueado o pendiente
    if (status === 403) {
      if (mensaje.includes('Pendiente') || mensaje.includes('revisión')) {
        this.router.navigate(['/auth/status'], { queryParams: { state: 'Pendiente' } });
      } else if (mensaje.includes('Bloqueada') || mensaje.includes('bloqueada')) {
        this.router.navigate(['/auth/status'], { queryParams: { state: 'Bloqueada' } });
      } else if (mensaje.includes('Rechazada') || mensaje.includes('rechazada')) {
        this.router.navigate(['/auth/status'], { queryParams: { state: 'Rechazada' } });
      } else if (mensaje.includes('eliminada')) {
        this.errorMessage.set('Esta cuenta ha sido eliminada.');
      } else {
        this.router.navigate(['/auth/status'], { queryParams: { state: 'Bloqueada' } });
      }
      return;
    }

    // Error genérico
    this.errorMessage.set('Error de conexión con el servidor. Inténtalo más tarde.');
  }

  private normalizeRole(role?: string): string {
    return (role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}


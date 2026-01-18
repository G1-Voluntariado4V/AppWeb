import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-callback',
    standalone: true,
    imports: [],
    templateUrl: './callback.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallbackPage implements OnInit {
    private router = inject(Router);
    private authService = inject(AuthService);

    async ngOnInit() {
        try {
            // Esperar a que Firebase Auth se inicialice
            const user = this.authService.getCurrentUser();

            if (!user) {
                // No hay sesión, redirigir a login
                this.router.navigate(['/auth/login']);
                return;
            }

            const googleId = user.providerData[0]?.uid || user.uid;
            const email = user.email;

            if (!email) {
                this.router.navigate(['/auth/login']);
                return;
            }

            // Verificar usuario en backend
            try {
                const backendUser = await this.authService.verifyUser(googleId, email);
                const estado = backendUser.estado_cuenta || backendUser.estado;

                // Verificar estado de cuenta
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

                // Redirigir según rol
                const role = (backendUser.rol || '').toLowerCase();
                if (role.includes('voluntar')) {
                    this.router.navigate(['/voluntario']);
                } else if (role.includes('coordin')) {
                    this.router.navigate(['/coordinador']);
                } else if (role.includes('organiz')) {
                    this.router.navigate(['/organizacion']);
                } else {
                    this.router.navigate(['/']);
                }

            } catch (error: any) {
                // Usuario no encontrado -> registro
                if (error?.status === 404) {
                    this.router.navigate(['/auth/register']);
                } else {
                    this.router.navigate(['/auth/login']);
                }
            }
        } catch {
            this.router.navigate(['/auth/login']);
        }
    }
}


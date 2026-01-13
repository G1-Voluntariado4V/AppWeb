import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

export type AccountStatus = 'Pendiente' | 'Activa' | 'Rechazada' | 'Bloqueada';

@Component({
    selector: 'app-status',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './status.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPage {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthService);

    currentStatus = signal<AccountStatus>('Pendiente');

    constructor() {
        this.route.queryParams.subscribe(params => {
            const state = params['state'];
            if (state && ['Pendiente', 'Activa', 'Rechazada', 'Bloqueada'].includes(state)) {
                this.currentStatus.set(state as AccountStatus);
            }
        });
    }

    async logout() {
        await this.authService.logout();
        this.router.navigate(['/auth/login']);
    }

    goToDashboard() {
        const backendUser = this.authService.getBackendUserSnapshot();
        if (!backendUser) {
            this.router.navigate(['/auth/login']);
            return;
        }

        const rol = (backendUser.rol || '').toLowerCase();

        if (rol.includes('coordin')) {
            this.router.navigate(['/coordinador']);
        } else if (rol.includes('voluntar')) {
            this.router.navigate(['/voluntario']);
        } else if (rol.includes('organiz')) {
            this.router.navigate(['/organizacion']);
        } else {
            this.router.navigate(['/']);
        }
    }
}

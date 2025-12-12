import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

export type AccountStatus = 'Pendiente' | 'Activa' | 'Rechazada' | 'Bloqueada';

@Component({
    selector: 'app-status',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './status.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPage {
    // Mock status for design purposes. 
    // In a real app, this would come from a service or route resolver.
    currentStatus = signal<AccountStatus>('Pendiente');

    constructor(private route: ActivatedRoute) {
        this.route.queryParams.subscribe(params => {
            const state = params['state'];
            if (state && ['Pendiente', 'Activa', 'Rechazada', 'Bloqueada'].includes(state)) {
                this.currentStatus.set(state as AccountStatus);
            }
        });
    }

    // Helper to change status for demo/testing
    setDemoStatus(status: AccountStatus) {
        this.currentStatus.set(status);
    }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-logout',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './logout.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoutPage implements OnInit {
    private router = inject(Router);
    private authService = inject(AuthService);

    ngOnInit() {
        // Simulate logout process (clearing tokens, state, etc.)
        this.authService.logout().finally(() => {
            setTimeout(() => {
                this.router.navigate(['/auth/login']);
            }, 1200);
        });
    }
}

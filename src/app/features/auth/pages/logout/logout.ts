import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-logout',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './logout.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoutPage implements OnInit {
    private router = inject(Router);

    ngOnInit() {
        // Simulate logout process (clearing tokens, state, etc.)
        setTimeout(() => {
            // Redirect to login or home after a brief moment
            this.router.navigate(['/auth/login']);
        }, 3000);
    }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-callback',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './callback.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallbackPage implements OnInit {
    private router = inject(Router);

    ngOnInit() {
        // Simulate processing delay (e.g., verifying token, fetching user data)
        // In a real app, you would capture the query params here and call your AuthService.
        setTimeout(() => {
            // Example logic:
            // If user is new -> router.navigate(['/auth/register']);
            // If user is active -> router.navigate(['/dashboard']);
            // If user is pending -> router.navigate(['/auth/status']);

            // For demo, let's just go to status
            this.router.navigate(['/auth/status']);
        }, 2000);
    }
}

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take, switchMap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.user$.pipe(
        filter(user => user !== undefined),
        take(1),
        switchMap(async (user) => {
            if (!user) {
                return router.createUrlTree(['/auth/login']);
            }

            // Verify with backend
            const googleId = user.providerData[0]?.uid || user.uid;
            try {
                const backendUser = await authService.verifyUser(googleId, user.email!);
                // Check if user has correct role/status if needed, but verifyUser already throws 403 if not active
                return true;
            } catch (error: any) {
                if (error.status === 403) {
                    const msg = error.error?.mensaje || '';
                    const statusState = (msg.includes('revisión') || msg.includes('verificada')) ? 'Pendiente' : 'Bloqueada';
                    return router.createUrlTree(['/auth/status'], { queryParams: { state: statusState } });
                } else if (error.status === 404) {
                    return router.createUrlTree(['/auth/register']);
                }
                // Other errors (server down, etc) -> maybe allow login to retry or show error page
                return router.createUrlTree(['/auth/login']);
            }
        })
    );
};
